import { Test, TestingModule } from '@nestjs/testing';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { PlayerPosition } from '../common/enums/player-position.enum';

describe('PlayersController', () => {
  let controller: PlayersController;

  const mockPlayersService = {
    findById: jest.fn(),
    findByTeam: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [{ provide: PlayersService, useValue: mockPlayersService }],
    }).compile();

    controller = module.get<PlayersController>(PlayersController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPlayer', () => {
    it('should return player by id', async () => {
      const player = {
        id: 'player-1',
        name: 'John Doe',
        position: PlayerPosition.ATT,
      };

      mockPlayersService.findById.mockResolvedValue(player);

      const result = await controller.getPlayer('player-1');

      expect(mockPlayersService.findById).toHaveBeenCalledWith('player-1');
      expect(result).toEqual(player);
    });
  });

  describe('getByTeam', () => {
    it('should return players for a team', async () => {
      const players = [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ];

      mockPlayersService.findByTeam.mockResolvedValue(players);

      const result = await controller.getByTeam('team-1');

      expect(mockPlayersService.findByTeam).toHaveBeenCalledWith('team-1');
      expect(result).toEqual(players);
    });
  });

  describe('update', () => {
    it('should update player with ownership check', async () => {
      const playerId = 'player-1';
      const userId = 'user-123';
      const dto = { name: 'Updated Name' };
      const updatedPlayer = { id: playerId, ...dto };

      mockPlayersService.update.mockResolvedValue(updatedPlayer);

      const result = await controller.update(playerId, userId, dto);

      expect(mockPlayersService.update).toHaveBeenCalledWith(
        playerId,
        userId,
        dto,
      );
      expect(result).toEqual(updatedPlayer);
    });
  });

  describe('delete', () => {
    it('should delete player with ownership check', async () => {
      const playerId = 'player-1';
      const userId = 'user-123';

      mockPlayersService.delete.mockResolvedValue({ success: true });

      const result = await controller.delete(playerId, userId);

      expect(mockPlayersService.delete).toHaveBeenCalledWith(playerId, userId);
      expect(result).toEqual({ success: true });
    });
  });
});
