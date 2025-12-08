import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from './transfers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransferListing } from './entities/transfer-listing.entity';
import { Player } from '../players/entities/player.entity';
import { Team } from '../teams/entities/team.entity';
import { TransferHistory } from './entities/transfer-history.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('TransfersService', () => {
  let service: TransfersService;
  type RepoManager = { getRepository: jest.Mock };

  const mockListingRepo = {
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockPlayerRepo = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        {
          provide: getRepositoryToken(TransferListing),
          useValue: mockListingRepo,
        },
        {
          provide: getRepositoryToken(Player),
          useValue: mockPlayerRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            clear: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createListing', () => {
    const userId = 'user-123';
    const createDto: CreateListingDto = {
      playerId: 'player-1',
      askingPrice: 1000,
    };

    it('should create a listing successfully', async () => {
      // Mock player found
      mockPlayerRepo.findOne.mockResolvedValue({
        id: 'player-1',
        name: 'John Doe',
        team: { id: 'team-1', user: { id: userId } },
      });
      // Mock not already listed
      mockListingRepo.findOne.mockResolvedValue(null);
      // Mock create/save
      mockListingRepo.create.mockReturnValue({
        ...createDto,
        player: { id: 'player-1' },
      });
      mockListingRepo.save.mockImplementation((listing) =>
        Promise.resolve({ id: 'list-1', ...listing }),
      );

      const result = await service.createListing(createDto, userId);
      expect(result).toHaveProperty('id', 'list-1');
      expect(mockListingRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own player', async () => {
      mockPlayerRepo.findOne.mockResolvedValue({
        id: 'player-1',
        team: { id: 'team-1', user: { id: 'other-user' } },
      });

      await expect(service.createListing(createDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if player already listed', async () => {
      mockPlayerRepo.findOne.mockResolvedValue({
        id: 'player-1',
        team: { id: 'team-1', user: { id: userId } },
      });
      mockListingRepo.findOne.mockResolvedValue({ id: 'existing-listing' });

      await expect(service.createListing(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeListing', () => {
    const userId = 'user-123';
    it('should remove listing if owner', async () => {
      mockListingRepo.findOne.mockResolvedValue({
        id: 'list-1',
        player: { team: { user: { id: userId } } },
      });
      mockListingRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.removeListing('list-1', userId);
      expect(result).toEqual({ success: true });
      expect(mockListingRepo.delete).toHaveBeenCalledWith('list-1');
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockListingRepo.findOne.mockResolvedValue({
        id: 'list-1',
        player: { team: { user: { id: 'other-user' } } },
      });

      await expect(service.removeListing('list-1', userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('buy', () => {
    it('should perform buy transaction successfully', async () => {
      const mockManager: RepoManager = { getRepository: jest.fn() };
      // Mock repositories returned by manager
      const mockListingRepoTx = {
        createQueryBuilder: jest.fn(),
        delete: jest.fn(),
      };
      const mockTeamRepoTx = { createQueryBuilder: jest.fn(), save: jest.fn() };
      const mockPlayerRepoTx = { count: jest.fn(), save: jest.fn() };
      const mockHistoryRepoTx = { save: jest.fn() };

      mockDataSource.transaction.mockImplementation(
        <T>(cb: (m: RepoManager) => Promise<T> | T): Promise<T> => {
          return Promise.resolve(cb(mockManager));
        },
      );

      mockManager.getRepository.mockImplementation((entity) => {
        if (entity === TransferListing) return mockListingRepoTx;
        if (entity === Team) return mockTeamRepoTx;
        if (entity === Player) return mockPlayerRepoTx;
        if (entity === TransferHistory) return mockHistoryRepoTx;
        return null;
      });

      // Mock listing query builder with pessimistic lock
      mockListingRepoTx.createQueryBuilder.mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 'list-1',
          askingPrice: 1000,
          player: {
            id: 'p1',
            team: { id: 'seller-team', user: { id: 'seller-user' } },
          },
        }),
      });

      // Team Repo creates QB
      mockTeamRepoTx.createQueryBuilder.mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'buyer-team',
            budget: 5000,
            user: { id: 'buyer-user' },
          })
          .mockResolvedValueOnce({ id: 'seller-team', budget: 1000 })
          .mockResolvedValueOnce({ id: 'seller-team', budget: 1000 })
          .mockResolvedValueOnce({ id: 'buyer-team', budget: 5000 }),
      });

      // Counts
      mockPlayerRepoTx.count.mockResolvedValueOnce(20);
      mockPlayerRepoTx.count.mockResolvedValueOnce(20);

      const result = await service.buy('list-1', 'buyer-user');

      expect(result.success).toBe(true);
      expect(result.finalPrice).toBe(950);
      expect(mockListingRepoTx.delete).toHaveBeenCalledWith('list-1');
    });

    it('should throw BadRequestException if buyer and seller are same', async () => {
      const mockManager: RepoManager = { getRepository: jest.fn() };
      mockDataSource.transaction.mockImplementation(
        <T>(cb: (m: RepoManager) => Promise<T> | T): Promise<T> =>
          Promise.resolve(cb(mockManager)),
      );

      mockManager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue({
            id: 'list-1',
            player: { team: { user: { id: 'same-user' } } },
          }),
        }),
      });

      await expect(service.buy('list-1', 'same-user')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if budget is insufficient', async () => {
      const mockManager: RepoManager = { getRepository: jest.fn() };
      mockDataSource.transaction.mockImplementation(
        <T>(cb: (m: RepoManager) => Promise<T> | T): Promise<T> =>
          Promise.resolve(cb(mockManager)),
      );

      const mockListingRepoTx = {
        createQueryBuilder: jest.fn().mockReturnValue({
          setLock: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue({
            id: 'list-1',
            askingPrice: 1000000,
            player: { team: { id: 's-t', user: { id: 's-u' } } },
          }),
        }),
      };
      const mockTeamRepoTx = { createQueryBuilder: jest.fn() };
      const mockPlayerRepoTx = { count: jest.fn() };

      mockManager.getRepository.mockImplementation((entity) => {
        if (entity === TransferListing) return mockListingRepoTx;
        if (entity === Team) return mockTeamRepoTx;
        if (entity === Player) return mockPlayerRepoTx;
      });

      mockTeamRepoTx.createQueryBuilder.mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce({ id: 'b-t', budget: 100 })
          .mockResolvedValueOnce({ id: 's-t' })
          .mockResolvedValueOnce({ id: 's-t', budget: 1000 })
          .mockResolvedValueOnce({ id: 'b-t', budget: 100 }),
      });

      mockPlayerRepoTx.count.mockResolvedValue(20);

      await expect(service.buy('list-1', 'b-u')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
