import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    enqueueTeamCreation: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('identify', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    describe('when user does not exist (registration)', () => {
      it('should create a new user and return token', async () => {
        const hashedPassword = 'hashed_password';
        const newUser = { id: 'user-123', email: dto.email };
        const token = 'jwt-token';

        mockUsersService.findByEmail.mockResolvedValue(null);
        (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
        mockUsersService.create.mockResolvedValue(newUser);
        mockUsersService.enqueueTeamCreation.mockResolvedValue({});
        mockJwtService.sign.mockReturnValue(token);

        const result = await service.identify(dto);

        expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
        expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
        expect(mockUsersService.create).toHaveBeenCalledWith({
          email: dto.email,
          password: hashedPassword,
        });
        expect(mockUsersService.enqueueTeamCreation).toHaveBeenCalledWith(
          newUser.id,
        );
        expect(result).toEqual({
          message: 'User registered successfully. Team creation in progress.',
          token,
        });
      });
    });

    describe('when user exists (login)', () => {
      const existingUser = {
        id: 'user-123',
        email: dto.email,
        password: 'hashed_password',
      };

      it('should return token when password is valid', async () => {
        const token = 'jwt-token';

        mockUsersService.findByEmail.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue(token);

        const result = await service.identify(dto);

        expect(bcrypt.compare).toHaveBeenCalledWith(
          dto.password,
          existingUser.password,
        );
        expect(result).toEqual({
          message: 'Logged in successfully',
          token,
        });
      });

      it('should throw UnauthorizedException when password is invalid', async () => {
        mockUsersService.findByEmail.mockResolvedValue(existingUser);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(service.identify(dto)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });
  });
});
