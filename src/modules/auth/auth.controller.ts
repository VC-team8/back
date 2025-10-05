import { Body, Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CompanyGuard } from './guards/company.guard';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('company/login')
  async companyLogin(@Body() loginDto: LoginDto) {
    return this.authService.loginCompany(loginDto);
  }

  @Post('user/login')
  async userLogin(@Body() loginDto: LoginDto) {
    return this.authService.loginUser(loginDto);
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Post('users')
  async createUser(@Request() req, @Body() createUserDto: CreateUserDto) {
    const companyId = req.user.userId;
    return this.usersService.create(companyId, createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }
}
