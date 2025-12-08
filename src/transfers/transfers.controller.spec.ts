import { Test, TestingModule } from '@nestjs/testing';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

describe('TransfersController', () => {
  let controller: TransfersController;

  const mockTransfersService = {
    findAll: jest.fn(),
    createListing: jest.fn(),
    removeListing: jest.fn(),
    buy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransfersController],
      providers: [
        { provide: TransfersService, useValue: mockTransfersService },
      ],
    }).compile();

    controller = module.get<TransfersController>(TransfersController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return paginated transfers list', async () => {
      const query = { limit: 10, offset: 0 };
      const response = {
        data: [{ id: 'list-1', askingPrice: 1000 }],
        pagination: { limit: 10, offset: 0, total: 1, hasMore: false },
        filters: query,
      };

      mockTransfersService.findAll.mockResolvedValue(response);

      const result = await controller.list(query);

      expect(mockTransfersService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(response);
    });

    it('should handle filters', async () => {
      const query = {
        playerName: 'Messi',
        teamId: 'team-123',
        minPrice: 100,
        maxPrice: 1000,
      };

      mockTransfersService.findAll.mockResolvedValue({
        data: [],
        pagination: {},
      });

      await controller.list(query);

      expect(mockTransfersService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('create', () => {
    it('should create a new listing', async () => {
      const dto = { playerId: 'player-1', askingPrice: 5000 };
      const userId = 'user-123';
      const listing = { id: 'list-1', ...dto };

      mockTransfersService.createListing.mockResolvedValue(listing);

      const result = await controller.create(dto, userId);

      expect(mockTransfersService.createListing).toHaveBeenCalledWith(
        dto,
        userId,
      );
      expect(result).toEqual(listing);
    });
  });

  describe('remove', () => {
    it('should remove listing by id', async () => {
      const listingId = 'list-1';
      const userId = 'user-123';

      mockTransfersService.removeListing.mockResolvedValue({ success: true });

      const result = await controller.remove(listingId, userId);

      expect(mockTransfersService.removeListing).toHaveBeenCalledWith(
        listingId,
        userId,
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('buy', () => {
    it('should buy player from listing', async () => {
      const dto = { listingId: 'list-1' };
      const userId = 'user-123';
      const buyResult = {
        success: true,
        finalPrice: 4750,
        playerId: 'player-1',
        buyerTeamId: 'buyer-team',
        sellerTeamId: 'seller-team',
      };

      mockTransfersService.buy.mockResolvedValue(buyResult);

      const result = await controller.buy(dto, userId);

      expect(mockTransfersService.buy).toHaveBeenCalledWith(
        dto.listingId,
        userId,
      );
      expect(result).toEqual(buyResult);
    });
  });
});
