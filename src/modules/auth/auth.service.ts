import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CompaniesService } from '../companies/companies.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateCompany(email: string, password: string): Promise<any> {
    const company = await this.companiesService.findByEmail(email);
    if (!company || !company.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, company.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = company;
    return result;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async loginCompany(loginDto: LoginDto) {
    const company = await this.validateCompany(loginDto.email, loginDto.password);

    const payload = {
      email: company.email,
      sub: company._id.toString(),
      type: 'company',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: company,
    };
  }

  async loginUser(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Fetch company data for the user
    const company = await this.companiesService.findOne(user.companyId.toString());

    const payload = {
      email: user.email,
      sub: user._id.toString(),
      companyId: user.companyId.toString(),
      type: 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        ...user,
        company,
      },
    };
  }
}
