import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TransferListing } from './entities/transfer-listing.entity';
import { Player } from '../players/entities/player.entity';
import { Team } from '../teams/entities/team.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import {
  PAGINATION_CONSTRAINTS,
  TEAM_CONSTRAINTS,
  TRANSFER_RULES,
} from '../config/constants';
import { TransferHistory } from './entities/transfer-history.entity';
import { CACHE_KEYS, CACHE_TTL } from '../config/cache.config';

type BuyResult = {
  success: true;
  finalPrice: number;
  playerId: string;
  buyerTeamId: string;
  sellerTeamId: string;
};

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    @InjectRepository(TransferListing)
    private readonly listingsRepo: Repository<TransferListing>,

    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,

    private readonly dataSource: DataSource,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
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
    // Generate cache key from filters
    const cacheKey = CACHE_KEYS.TRANSFERS_LIST(JSON.stringify(filters || {}));

    // Define response type for consistency
    type PaginatedListingsResponse = {
      data: TransferListing[];
      pagination: {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
      };
      filters: typeof filters;
    };

    // Try to get from cache
    const cached =
      await this.cacheManager.get<PaginatedListingsResponse>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for transfers list: ${cacheKey}`);
      return cached;
    }

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

    const take = Math.min(
      Math.max(
        filters?.limit ?? PAGINATION_CONSTRAINTS.DEFAULT_LIMIT,
        PAGINATION_CONSTRAINTS.MIN_LIMIT,
      ),
      PAGINATION_CONSTRAINTS.MAX_LIMIT,
    );
    const skip = Math.max(filters?.offset ?? 0, 0);
    qb.take(take).skip(skip);

    const results = await qb.getMany();
    const total = await qb.getCount();

    const response: PaginatedListingsResponse = {
      data: results,
      pagination: {
        limit: take,
        offset: skip,
        total,
        hasMore: skip + results.length < total,
      },
      filters,
    };

    // Store in cache
    await this.cacheManager.set(cacheKey, response, CACHE_TTL.TRANSFERS_LIST);
    await this.trackTransfersCacheKey(cacheKey);
    this.logger.debug(`Cached transfers list: ${cacheKey}`);

    return response;
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

    const listing = this.listingsRepo.create({
      player,
      askingPrice: dto.askingPrice,
    });

    const savedListing = await this.listingsRepo.save(listing);

    // Invalidate all transfers list caches
    await this.invalidateTransfersCache();
    this.logger.log(`Created listing ${savedListing.id}, invalidated cache`);

    return savedListing;
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
    await this.invalidateTransfersCache();
    this.logger.log(`Removed listing ${listingId}, invalidated cache`);
    return { success: true };
  }

  /**
   * Buys a player from a transfer listing if the buyer has enough balance.
   * @param listingId The ID of the listing to buy the player from.
   * @param buyerUserId The ID of the user attempting to buy the player.
   * @returns An object containing the purchased player and the updated buyer's balance.
   */
  async buy(listingId: string, buyerUserId: string): Promise<BuyResult> {
    this.logger.log(
      `Transfer initiated for listing=${listingId}, buyer=${buyerUserId}`,
    );
    let result: BuyResult;
    try {
      // Use a transaction to ensure atomicity
      result = await this.dataSource.transaction(
        async (manager): Promise<BuyResult> => {
          // re-load listing with row-level locks by using manager and locking the relevant rows
          const listing = await manager
            .getRepository(TransferListing)
            .createQueryBuilder('listing')
            .setLock('pessimistic_write')
            .innerJoinAndSelect('listing.player', 'player')
            .innerJoinAndSelect('player.team', 'team')
            .innerJoinAndSelect('team.user', 'user')
            .where('listing.id = :id', { id: listingId })
            .getOne();

          if (!listing) throw new NotFoundException('Listing not found');

          const player = listing.player;
          const sellerTeam = player.team;
          const sellerUser = sellerTeam?.user;

          if (!sellerTeam || !sellerUser) {
            throw new BadRequestException(
              'Player does not belong to a valid team',
            );
          }

          if (sellerUser.id === buyerUserId) {
            throw new BadRequestException('Cannot buy your own player');
          }

          // Lock buyer team and seller team and player rows to avoid race conditions
          // Fetch buyerTeam, sellerTeam with FOR UPDATE via query builder (manager)
          const buyerTeamLocked = await manager
            .getRepository(Team)
            .createQueryBuilder('team')
            .setLock('pessimistic_write')
            .leftJoinAndSelect('team.user', 'user')
            .where('user.id = :userId', { userId: buyerUserId })
            .getOne();

          if (!buyerTeamLocked)
            throw new BadRequestException('Buyer has no team');

          // Re-fetch seller team with lock
          const sellerTeamLocked = await manager
            .getRepository(Team)
            .createQueryBuilder('team')
            .setLock('pessimistic_write')
            .where('team.id = :id', { id: sellerTeam.id })
            .getOne();

          if (!sellerTeamLocked)
            throw new BadRequestException('Seller has no team');

          // Count players in each team
          const sellerPlayersCount = await manager.getRepository(Player).count({
            where: { team: { id: sellerTeamLocked.id } },
          });

          const buyerPlayersCount = await manager.getRepository(Player).count({
            where: { team: { id: buyerTeamLocked.id } },
          });

          if (sellerPlayersCount - 1 < TEAM_CONSTRAINTS.MIN_PLAYERS) {
            throw new BadRequestException(
              'Seller team would fall below minimum players (15)',
            );
          }

          if (buyerPlayersCount + 1 > TEAM_CONSTRAINTS.MAX_PLAYERS) {
            throw new BadRequestException(
              'Buyer team would exceed maximum players (25)',
            );
          }

          // Calculate final price (95% rule)
          const finalPrice = Math.floor(
            listing.askingPrice *
              (TRANSFER_RULES.SELLER_RECEIVES_PERCENT / 100),
          );

          if (buyerTeamLocked.budget < finalPrice) {
            throw new BadRequestException('Buyer team has insufficient budget');
          }

          // Debit buyer, credit seller
          buyerTeamLocked.budget = buyerTeamLocked.budget - finalPrice;
          sellerTeamLocked.budget = sellerTeamLocked.budget + finalPrice;

          // Move player to buyer team
          player.team = buyerTeamLocked;

          // Persist changes via manager
          await manager.getRepository(Player).save(player);
          await manager.getRepository(Team).save(buyerTeamLocked);
          await manager.getRepository(Team).save(sellerTeamLocked);

          // Remove listing
          await manager.getRepository(TransferListing).delete(listingId);

          await manager.getRepository(TransferHistory).save({
            player,
            fromTeam: sellerTeamLocked,
            toTeam: buyerTeamLocked,
            price: finalPrice,
          });

          const res: BuyResult = {
            success: true,
            finalPrice,
            playerId: player.id,
            buyerTeamId: buyerTeamLocked.id,
            sellerTeamId: sellerTeamLocked.id,
          };
          return res;
        },
      );
      // Invalidate transfers cache after successful buy
      await this.invalidateTransfersCache();
      this.logger.log(
        `Transfer completed successfully: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Transfer failed for listing=${listingId}, buyer=${buyerUserId}: ${message}`,
      );
      throw err;
    }
  }

  /**
   * Invalidates all transfer listing caches.
   * Called after mutations (create, buy, remove).
   */
  private async invalidateTransfersCache() {
    const indexKey = 'transfers:index';
    const keys = (await this.cacheManager.get<string[]>(indexKey)) || [];
    if (keys.length) {
      await this.cacheManager.mdel(keys);
    }
    await this.cacheManager.set(indexKey, [], CACHE_TTL.TRANSFERS_LIST);
    this.logger.debug(`Invalidated ${keys.length} transfer cache keys`);
  }

  private async trackTransfersCacheKey(key: string) {
    const indexKey = 'transfers:index';
    const existing = (await this.cacheManager.get<string[]>(indexKey)) || [];
    if (!existing.includes(key)) {
      existing.push(key);
      await this.cacheManager.set(indexKey, existing, CACHE_TTL.TRANSFERS_LIST);
    }
  }
}
