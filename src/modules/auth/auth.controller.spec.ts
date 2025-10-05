import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  const mockAuthService = {
    loginCompany: jest.fn(),
    loginUser: jest.fn(),
  };

  const mockUsersService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('companyLogin', () => {
    it('should call authService.loginCompany and return result', async () => {
      const loginDto: LoginDto = {
        email: 'company@example.com',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'mock-jwt-token',
        user: {
          _id: '507f1f77bcf86cd799439011',
          email: 'company@example.com',
          name: 'Test Company',
        },
      };

      mockAuthService.loginCompany.mockResolvedValue(expectedResult);

      const result = await controller.companyLogin(loginDto);

      expect(authService.loginCompany).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('userLogin', () => {
    it('should call authService.loginUser and return result', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'mock-jwt-token',
        user: {
          _id: '507f1f77bcf86cd799439012',
          email: 'user@example.com',
          name: 'Test User',
          companyId: '507f1f77bcf86cd799439011',
        },
      };

      mockAuthService.loginUser.mockResolvedValue(expectedResult);

      const result = await controller.userLogin(loginDto);

      expect(authService.loginUser).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createUser', () => {
    it('should create user with company ID from JWT token', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const mockRequest = {
        user: {
          userId: '507f1f77bcf86cd799439011',
          type: 'company',
        },
      };

      const expectedResult = {
        _id: '507f1f77bcf86cd799439013',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        companyId: '507f1f77bcf86cd799439011',
      };

      mockUsersService.create.mockResolvedValue(expectedResult);

      const result = await controller.createUser(mockRequest, createUserDto);

      expect(usersService.create).toHaveBeenCalledWith('507f1f77bcf86cd799439011', createUserDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getProfile', () => {
    it('should return user from JWT token', async () => {
      const mockRequest = {
        user: {
          userId: '507f1f77bcf86cd799439011',
          email: 'company@example.com',
          type: 'company',
        },
      };

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockRequest.user);
    });
  });
});
