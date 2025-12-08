import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockAuthService = {
    identify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('identify', () => {
    it('should call authService.identify with dto', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const expectedResult = {
        message: 'Logged in successfully',
        token: 'jwt-token',
      };

      mockAuthService.identify.mockResolvedValue(expectedResult);

      const result = await controller.identify(dto);

      expect(authService.identify).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
