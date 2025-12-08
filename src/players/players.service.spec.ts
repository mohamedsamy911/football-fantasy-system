import { Test, TestingModule } from '@nestjs/testing';
import { PlayersService } from './players.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { NotFoundException } from '@nestjs/common';
import { PlayerPosition } from '../common/enums/player-position.enum';

describe('PlayersService', () => {
  let service: PlayersService;

  const mockPlayersRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: getRepositoryToken(Player), useValue: mockPlayersRepo },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return player with team relation', async () => {
      const player = {
        id: 'player-1',
        name: 'John Doe',
        position: PlayerPosition.ATT,
        team: { id: 'team-1' },
      };

      mockPlayersRepo.findOne.mockResolvedValue(player);

      const result = await service.findById('player-1');

      expect(mockPlayersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        relations: ['team'],
      });
      expect(result).toEqual(player);
    });

    it('should return null if player not found', async () => {
      mockPlayersRepo.findOne.mockResolvedValue(null);

      const result = await service.findById('not-found');

      expect(result).toBeNull();
    });
  });

  describe('findByTeam', () => {
    it('should return all players for a team', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      mockPlayersRepo.find.mockResolvedValue(players);

      const result = await service.findByTeam('team-1');

      expect(mockPlayersRepo.find).toHaveBeenCalledWith({
        where: { team: { id: 'team-1' } },
      });
      expect(result).toEqual(players);
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const playerId = 'player-1';
    const dto = { name: 'Updated Name' };

    it('should update player when user owns it', async () => {
      const existingPlayer = {
        id: playerId,
        name: 'Old Name',
        team: { id: 'team-1', user: { id: userId } },
      };

      mockPlayersRepo.findOne
        .mockResolvedValueOnce(existingPlayer) // findById
        .mockResolvedValueOnce(existingPlayer); // findOwnedPlayer

      mockPlayersRepo.save.mockResolvedValue({ ...existingPlayer, ...dto });

      const result = await service.update(playerId, userId, dto);

      expect(result.name).toBe('Updated Name');
      expect(mockPlayersRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayersRepo.findOne.mockResolvedValue(null);

      await expect(service.update(playerId, userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user does not own player', async () => {
      const existingPlayer = {
        id: playerId,
        name: 'Old Name',
        team: { id: 'team-1' },
      };

      mockPlayersRepo.findOne
        .mockResolvedValueOnce(existingPlayer) // findById
        .mockResolvedValueOnce(null); // findOwnedPlayer (not owned)

      await expect(service.update(playerId, userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    const userId = 'user-123';
    const playerId = 'player-1';

    it('should delete player when user owns it', async () => {
      const ownedPlayer = {
        id: playerId,
        team: { id: 'team-1', user: { id: userId } },
      };

      mockPlayersRepo.findOne.mockResolvedValue(ownedPlayer);
      mockPlayersRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete(playerId, userId);

      expect(result).toEqual({ success: true });
      expect(mockPlayersRepo.delete).toHaveBeenCalledWith(playerId);
    });

    it('should throw NotFoundException if user does not own player', async () => {
      mockPlayersRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(playerId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOwnedPlayer', () => {
    it('should return player if owned by user', async () => {
      const player = {
        id: 'player-1',
        team: { id: 'team-1', user: { id: 'user-123' } },
      };

      mockPlayersRepo.findOne.mockResolvedValue(player);

      const result = await service.findOwnedPlayer('player-1', 'user-123');

      expect(mockPlayersRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: 'player-1',
          team: { user: { id: 'user-123' } },
        },
        relations: ['team', 'team.user'],
      });
      expect(result).toEqual(player);
    });

    it('should return null if not owned', async () => {
      mockPlayersRepo.findOne.mockResolvedValue(null);

      const result = await service.findOwnedPlayer('player-1', 'other-user');

      expect(result).toBeNull();
    });
  });
});
