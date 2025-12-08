import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { getQueueToken } from '@nestjs/bull';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTeamCreationQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        {
          provide: getQueueToken('team-creation'),
          useValue: mockTeamCreationQueue,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return user with team relation', async () => {
      const email = 'test@example.com';
      const user = { id: 'user-123', email, team: { id: 'team-1' } };

      mockUsersRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: ['team'],
        select: ['id', 'email', 'password'],
      });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const dto = { email: 'new@example.com', password: 'hashed_password' };
      const createdUser = { id: 'user-456', ...dto };

      mockUsersRepo.create.mockReturnValue(dto);
      mockUsersRepo.save.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(mockUsersRepo.create).toHaveBeenCalledWith(dto);
      expect(mockUsersRepo.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(createdUser);
    });
  });

  describe('enqueueTeamCreation', () => {
    it('should add job to team-creation queue', async () => {
      const userId = 'user-123';
      const job = { id: 'job-1' };

      mockTeamCreationQueue.add.mockResolvedValue(job);

      const result = await service.enqueueTeamCreation(userId);

      expect(mockTeamCreationQueue.add).toHaveBeenCalledWith('create-team', {
        userId,
      });
      expect(result).toEqual(job);
    });
  });

  describe('findById', () => {
    it('should return user with team relation', async () => {
      const id = 'user-123';
      const user = { id, email: 'test@example.com', team: { id: 'team-1' } };

      mockUsersRepo.findOne.mockResolvedValue(user);

      const result = await service.findById(id);

      expect(mockUsersRepo.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['team'],
      });
      expect(result).toEqual(user);
    });
  });
});
