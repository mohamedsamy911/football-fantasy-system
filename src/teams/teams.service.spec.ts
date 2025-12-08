import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { Player } from '../players/entities/player.entity';
import { PlayerPosition } from '../common/enums/player-position.enum';

describe('TeamsService', () => {
  let service: TeamsService;

  const mockTeamsRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPlayersRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getRepositoryToken(Team), useValue: mockTeamsRepo },
        { provide: getRepositoryToken(Player), useValue: mockPlayersRepo },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTeamForUser', () => {
    it('should create a team with default budget', async () => {
      const userId = 'user-123';
      const team = { id: 'team-1', user: { id: userId }, budget: 5000000 };

      mockTeamsRepo.create.mockReturnValue(team);
      mockTeamsRepo.save.mockResolvedValue(team);

      const result = await service.createTeamForUser(userId);

      expect(mockTeamsRepo.create).toHaveBeenCalledWith({
        user: { id: userId },
        budget: 5000000,
      });
      expect(mockTeamsRepo.save).toHaveBeenCalledWith(team);
      expect(result).toEqual(team);
    });
  });

  describe('generatePlayers', () => {
    it('should generate 20 players with correct distribution', async () => {
      const teamId = 'team-1';
      const createdPlayers: Array<{
        position: PlayerPosition;
        team: { id: string };
        name: string;
      }> = [];

      mockPlayersRepo.create.mockImplementation(
        (data: {
          position: PlayerPosition;
          team: { id: string };
          name: string;
        }) => {
          createdPlayers.push(data);
          return data;
        },
      );
      mockPlayersRepo.save.mockResolvedValue(createdPlayers);

      await service.generatePlayers(teamId);

      // Should create 20 players: 3 GK + 6 DEF + 6 MID + 5 ATT
      expect(mockPlayersRepo.create).toHaveBeenCalledTimes(20);
      expect(mockPlayersRepo.save).toHaveBeenCalled();

      // Verify distribution
      const positions = createdPlayers.map((p) => p.position);
      expect(positions.filter((p) => p === PlayerPosition.GK).length).toBe(3);
      expect(positions.filter((p) => p === PlayerPosition.DEF).length).toBe(6);
      expect(positions.filter((p) => p === PlayerPosition.MID).length).toBe(6);
      expect(positions.filter((p) => p === PlayerPosition.ATT).length).toBe(5);
    });

    it('should assign team id to all players', async () => {
      const teamId = 'team-1';
      const createdPlayers: Array<{
        position: PlayerPosition;
        team: { id: string };
        name: string;
      }> = [];

      mockPlayersRepo.create.mockImplementation(
        (data: {
          position: PlayerPosition;
          team: { id: string };
          name: string;
        }) => {
          createdPlayers.push(data);
          return data;
        },
      );
      mockPlayersRepo.save.mockResolvedValue(createdPlayers);

      await service.generatePlayers(teamId);

      createdPlayers.forEach((player) => {
        expect(player.team).toEqual({ id: teamId });
      });
    });
  });

  describe('getPlayers', () => {
    it('should return players for a team', async () => {
      const teamId = 'team-1';
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      mockPlayersRepo.find.mockResolvedValue(players);

      const result = await service.getPlayers(teamId);

      expect(mockPlayersRepo.find).toHaveBeenCalledWith({
        where: { team: { id: teamId } },
      });
      expect(result).toEqual(players);
    });

    it('should return empty array if no players found', async () => {
      mockPlayersRepo.find.mockResolvedValue([]);

      const result = await service.getPlayers('empty-team');

      expect(result).toEqual([]);
    });
  });
});
