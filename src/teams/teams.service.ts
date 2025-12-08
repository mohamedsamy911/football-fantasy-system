import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Repository } from 'typeorm';
import { Player } from '../players/entities/player.entity';
import { PlayerPosition } from '../common/enums/player-position.enum';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepo: Repository<Team>,

    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
  ) {}

  /**
   * Creates a new team for a user with a budget of 5,000,000.
   * @param userId The ID of the user to create the team for.
   * @returns The newly created team entity.
   */
  async createTeamForUser(userId: string) {
    const team = this.teamsRepo.create({
      user: { id: userId },
      budget: 5000000,
    });

    return this.teamsRepo.save(team);
  }

  /**
   * Generates a random name for a player.
   * @returns A string containing a random first name and last name.
   */
  private randomName() {
    const first = [
      'John',
      'Leo',
      'Mark',
      'Sam',
      'Chris',
      'David',
      'Niko',
      'Alex',
    ];
    const last = [
      'Smith',
      'Johnson',
      'Miller',
      'Brown',
      'Lopez',
      'Garcia',
      'Santos',
      'Kosta',
    ];
    return `${first[Math.floor(Math.random() * first.length)]} ${
      last[Math.floor(Math.random() * last.length)]
    }`;
  }

  /**
   * Generates a set of players for a team based on a predefined distribution.
   * @param teamId The ID of the team to generate players for.
   * @returns An array of newly created player entities.
   */
  async generatePlayers(teamId: string) {
    const distribution = [
      { position: PlayerPosition.GK, count: 3 },
      { position: PlayerPosition.DEF, count: 6 },
      { position: PlayerPosition.MID, count: 6 },
      { position: PlayerPosition.ATT, count: 5 },
    ];

    const toInsert: Player[] = [];

    for (const group of distribution) {
      for (let i = 0; i < group.count; i++) {
        toInsert.push(
          this.playersRepo.create({
            name: this.randomName(),
            position: group.position,
            team: { id: teamId },
          }),
        );
      }
    }

    return this.playersRepo.save(toInsert);
  }

  /**
   * Retrieves all players associated with a specific team.
   * @param teamId The ID of the team to retrieve players for.
   * @returns An array of player entities associated with the team.
   */
  async getPlayers(teamId: string) {
    return this.playersRepo.find({ where: { team: { id: teamId } } });
  }
}
