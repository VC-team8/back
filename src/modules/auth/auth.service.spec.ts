import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { CompaniesService } from '../companies/companies.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let companiesService: CompaniesService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockCompany = {
    _id: '507f1f77bcf86cd799439011',
    email: 'company@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Test Company',
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    email: 'user@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Test User',
    companyId: '507f1f77bcf86cd799439011',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CompaniesService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    companiesService = module.get<CompaniesService>(CompaniesService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCompany', () => {
    it('should return company without password when credentials are valid', async () => {
      jest.spyOn(companiesService, 'findByEmail').mockResolvedValue(mockCompany as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateCompany('company@example.com', 'password123');

      expect(result).toEqual({
        _id: mockCompany._id,
        email: mockCompany.email,
        name: mockCompany.name,
      });
      expect(result.password).toBeUndefined();
    });

    it('should throw UnauthorizedException when company not found', async () => {
      jest.spyOn(companiesService, 'findByEmail').mockResolvedValue(null);

      await expect(
        authService.validateCompany('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when company has no password', async () => {
      jest.spyOn(companiesService, 'findByEmail').mockResolvedValue({ ...mockCompany, password: null } as any);

      await expect(
        authService.validateCompany('company@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      jest.spyOn(companiesService, 'findByEmail').mockResolvedValue(mockCompany as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        authService.validateCompany('company@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser('user@example.com', 'password123');

      expect(result).toEqual({
        _id: mockUser._id,
        email: mockUser.email,
        name: mockUser.name,
        companyId: mockUser.companyId,
      });
      expect(result.password).toBeUndefined();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(
        authService.validateUser('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        authService.validateUser('user@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginCompany', () => {
    it('should return access token and company data', async () => {
      const loginDto: LoginDto = {
        email: 'company@example.com',
        password: 'password123',
      };

      jest.spyOn(authService, 'validateCompany').mockResolvedValue({
        _id: mockCompany._id,
        email: mockCompany.email,
        name: mockCompany.name,
      });
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      const result = await authService.loginCompany(loginDto);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          _id: mockCompany._id,
          email: mockCompany.email,
          name: mockCompany.name,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockCompany.email,
        sub: mockCompany._id,
        type: 'company',
      });
    });

    it('should throw UnauthorizedException when validation fails', async () => {
      const loginDto: LoginDto = {
        email: 'company@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'validateCompany').mockRejectedValue(new UnauthorizedException());

      await expect(authService.loginCompany(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginUser', () => {
    it('should return access token and user data', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue({
        _id: mockUser._id,
        email: mockUser.email,
        name: mockUser.name,
        companyId: mockUser.companyId,
      });
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      const result = await authService.loginUser(loginDto);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          _id: mockUser._id,
          email: mockUser.email,
          name: mockUser.name,
          companyId: mockUser.companyId,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        companyId: mockUser.companyId,
        type: 'user',
      });
    });

    it('should throw UnauthorizedException when validation fails', async () => {
      const loginDto: LoginDto = {
        email: 'user@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'validateUser').mockRejectedValue(new UnauthorizedException());

      await expect(authService.loginUser(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
