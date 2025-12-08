import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
  ) {}

  /**
   * Retrieves a player by its ID.
   * @param id The ID of the player to retrieve.
   * @returns The player entity if found, otherwise throws a NotFoundException.
   */
  findById(id: string) {
    return this.playersRepo.findOne({
      where: { id },
      relations: ['team'],
    });
  }

  /**
   * Retrieves all players associated with a specific team.
   * @param teamId The ID of the team to retrieve players for.
   * @returns An array of player entities associated with the team.
   */
  findByTeam(teamId: string) {
    return this.playersRepo.find({
      where: { team: { id: teamId } },
    });
  }

  /**
   * Updates a player's information.
   * @param id The ID of the player to update.
   * @param userId The ID of the user who is updating the player.
   * @param dto The data transfer object containing the updated player details.
   * @returns The updated player entity.
   */
  async update(id: string, userId: string, dto: UpdatePlayerDto) {
    const player = await this.findById(id);

    if (!player) throw new NotFoundException('Player not found');

    if (!(await this.findOwnedPlayer(id, userId)))
      throw new NotFoundException('You do not own this player');

    Object.assign(player, dto);
    return this.playersRepo.save(player);
  }

  /**
   * Deletes a player by its ID.
   * @param id The ID of the player to delete.
   * @param userId The ID of the user who is deleting the player.
   * @returns The result of the delete operation.
   */
  async delete(id: string, userId: string) {
    if (!(await this.findOwnedPlayer(id, userId)))
      throw new NotFoundException('You do not own this player');

    await this.playersRepo.delete(id);

    return { success: true };
  }

  /**
   * Retrieves a player owned by a specific user.
   * @param playerId The ID of the player to retrieve.
   * @param userId The ID of the user to check ownership for.
   * @returns The player entity if found, otherwise throws a NotFoundException.
   */
  async findOwnedPlayer(playerId: string, userId: string) {
    return this.playersRepo.findOne({
      where: {
        id: playerId,
        team: { user: { id: userId } },
      },
      relations: ['team', 'team.user'],
    });
  }
}
