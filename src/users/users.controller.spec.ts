import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUser', () => {
    it('should return user by id', async () => {
      const userId = 'user-123';
      const user = { id: userId, email: 'test@example.com' };

      mockUsersService.findById.mockResolvedValue(user);

      const result = await controller.getUser(userId);

      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await controller.getUser('not-found');

      expect(result).toBeNull();
    });
  });
});
