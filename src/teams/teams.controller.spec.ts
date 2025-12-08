import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

describe('TeamsController', () => {
  let controller: TeamsController;

  const mockTeamsService = {
    getPlayers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [{ provide: TeamsService, useValue: mockTeamsService }],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPlayers', () => {
    it('should return players for a team', async () => {
      const teamId = 'team-123';
      const players = [
        { id: 'p1', name: 'Player 1', position: 'ATT' },
        { id: 'p2', name: 'Player 2', position: 'DEF' },
      ];

      mockTeamsService.getPlayers.mockResolvedValue(players);

      const result = await controller.getPlayers(teamId);

      expect(mockTeamsService.getPlayers).toHaveBeenCalledWith(teamId);
      expect(result).toEqual(players);
    });

    it('should return empty array if no players', async () => {
      mockTeamsService.getPlayers.mockResolvedValue([]);

      const result = await controller.getPlayers('empty-team');

      expect(result).toEqual([]);
    });
  });
});
