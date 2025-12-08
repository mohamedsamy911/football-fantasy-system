import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TransferListing } from './entities/transfer-listing.entity';
import { Player } from '../players/entities/player.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(TransferListing)
    private readonly listingsRepo: Repository<TransferListing>,

    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,

    private readonly dataSource: DataSource, // for transactions
  ) {}

  /**
   * Retrieves a list of transfer listings based on optional filters.
   * @param filters Optional filters to apply to the query.
   * @returns A Promise that resolves to an array of TransferListing entities.
   */
  async findAll(filters?: {
    playerName?: string;
    teamId?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }) {
    const qb = this.listingsRepo
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.player', 'player')
      .leftJoin('player.team', 'team')
      .leftJoin('team.user', 'user')
      .addSelect(['team.id', 'user.id', 'user.email']);

    if (filters?.playerName) {
      qb.andWhere('LOWER(player.name) LIKE :name', {
        name: `%${filters.playerName.toLowerCase()}%`,
      });
    }

    if (filters?.teamId) {
      qb.andWhere('team.id = :teamId', { teamId: filters.teamId });
    }

    if (typeof filters?.minPrice === 'number') {
      qb.andWhere('listing.askingPrice >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (typeof filters?.maxPrice === 'number') {
      qb.andWhere('listing.askingPrice <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    qb.orderBy('listing.createdAt', 'DESC');

    if (filters?.limit) qb.limit(filters.limit);
    if (filters?.offset) qb.offset(filters.offset);

    return qb.getMany();
  }

  /**
   * Creates a new transfer listing for a player owned by the specified user.
   * @param dto The data transfer object containing the listing details.
   * @param userId The ID of the user who owns the player.
   * @returns A Promise that resolves to the newly created TransferListing entity.
   */
  async createListing(dto: CreateListingDto, userId: string) {
    // ensure player exists and belongs to the user
    const player = await this.playersRepo.findOne({
      where: { id: dto.playerId },
      relations: {
        team: {
          user: true,
        },
      },
      select: {
        id: true,
        name: true,
        position: true,
        createdAt: true,
        team: {
          id: true,
          user: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!player) throw new NotFoundException('Player not found');

    const ownerId = player.team?.user?.id;
    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException('You do not own this player');
    }

    // ensure player is not already listed
    const existing = await this.listingsRepo.findOne({
      where: { player: { id: player.id } },
    });
    if (existing) throw new BadRequestException('Player already listed');

    // ensure team has minimum 15 players
    const totalTeamPlayers = await this.playersRepo.count({
      where: { team: { id: player.team.id } },
    });

    if (totalTeamPlayers <= 15) {
      throw new BadRequestException('Team can have minimum 15 players');
    }

    const listing = this.listingsRepo.create({
      player,
      askingPrice: dto.askingPrice,
    });

    return this.listingsRepo.save(listing);
  }

  /**
   * Removes a transfer listing by its ID if the user owns the listing.
   * @param listingId The ID of the listing to remove.
   * @param userId The ID of the user attempting to remove the listing.
   * @returns An object indicating the success of the operation.
   */
  async removeListing(listingId: string, userId: string) {
    const listing = await this.listingsRepo.findOne({
      where: { id: listingId },
      relations: ['player', 'player.team', 'player.team.user'],
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const ownerId = listing.player.team?.user?.id;
    if (ownerId !== userId) throw new ForbiddenException('Not allowed');

    await this.listingsRepo.delete(listingId);
    return { success: true };
  }

  /**
   * Buys a player from a transfer listing if the buyer has enough balance.
   * @param listingId The ID of the listing to buy the player from.
   * @param buyerUserId The ID of the user attempting to buy the player.
   * @returns An object containing the purchased player and the updated buyer's balance.
   */
  async buy(listingId: string, buyerUserId: string) {
    // Use a transaction to ensure atomicity
    return this.dataSource.transaction(async (manager) => {
      // re-load listing with row-level locks by using manager and locking the relevant rows
      const listing = await manager.getRepository(TransferListing).findOne({
        where: { id: listingId },
        relations: ['player', 'player.team', 'player.team.user'],
      });
      if (!listing) throw new NotFoundException('Listing not found');

      const player = listing.player;
      const sellerTeam = player.team;
      const sellerUser = sellerTeam?.user;

      if (!sellerTeam || !sellerUser) {
        throw new BadRequestException('Player does not belong to a valid team');
      }

      if (sellerUser.id === buyerUserId) {
        throw new BadRequestException('Cannot buy your own player');
      }

      // Lock buyer team and seller team and player rows to avoid race conditions
      // Fetch buyerTeam, sellerTeam with FOR UPDATE via query builder (manager)
      const buyerTeam = await manager
        .getRepository(Team)
        .createQueryBuilder('team')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('team.user', 'user')
        .where('user.id = :userId', { userId: buyerUserId })
        .getOne();

      if (!buyerTeam) throw new BadRequestException('Buyer has no team');

      // Re-fetch seller team with lock
      const sellerTeamLocked = await manager
        .getRepository(Team)
        .createQueryBuilder('team')
        .setLock('pessimistic_write')
        .where('team.id = :id', { id: sellerTeam.id })
        .getOne();

      // Count players in each team
      const sellerPlayersCount = await manager.getRepository(Player).count({
        where: { team: { id: sellerTeam.id } },
      });

      const buyerPlayersCount = await manager.getRepository(Player).count({
        where: { team: { id: buyerTeam.id } },
      });

      // Enforce team size constraints
      const MIN_PLAYERS = 15;
      const MAX_PLAYERS = 25;

      if (sellerPlayersCount - 1 < MIN_PLAYERS) {
        throw new BadRequestException(
          'Seller team would fall below minimum players (15)',
        );
      }

      if (buyerPlayersCount + 1 > MAX_PLAYERS) {
        throw new BadRequestException(
          'Buyer team would exceed maximum players (25)',
        );
      }

      // Calculate final price (95% rule)
      const finalPrice = Math.floor(listing.askingPrice * 0.95);

      // Load teams with budgets
      const sellerTeamWithBudget = await manager
        .getRepository(Team)
        .createQueryBuilder('team')
        .setLock('pessimistic_write')
        .where('team.id = :id', { id: sellerTeam.id })
        .getOne();

      const buyerTeamWithBudget = await manager
        .getRepository(Team)
        .createQueryBuilder('team')
        .setLock('pessimistic_write')
        .where('team.id = :id', { id: buyerTeam.id })
        .getOne();

      if (!buyerTeamWithBudget || !sellerTeamWithBudget) {
        throw new BadRequestException('Teams not found');
      }

      if (buyerTeamWithBudget.budget < finalPrice) {
        throw new BadRequestException('Buyer team has insufficient budget');
      }

      // Debit buyer, credit seller
      buyerTeamWithBudget.budget = buyerTeamWithBudget.budget - finalPrice;
      sellerTeamWithBudget.budget = sellerTeamWithBudget.budget + finalPrice;

      // Move player to buyer team
      player.team = buyerTeamWithBudget;

      // Persist changes via manager
      await manager.getRepository(Player).save(player);
      await manager.getRepository(Team).save(buyerTeamWithBudget);
      await manager.getRepository(Team).save(sellerTeamWithBudget);

      // Remove listing
      await manager.getRepository(TransferListing).delete(listingId);

      return {
        success: true,
        finalPrice,
        playerId: player.id,
        buyerTeamId: buyerTeamWithBudget.id,
        sellerTeamId: sellerTeamWithBudget.id,
      };
    });
  }
}
