import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByPhone(loginDto.phone);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordMatch = await this.userService.compareHash(
      loginDto.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = { id: user.id, phone: user.phone, role: user.role };

    // Generate access token (short-lived, e.g. 15 min)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    // Generate refresh token (longer-lived, e.g. 7 days)
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    if (!accessToken || !refreshToken) {
      throw new BadRequestException('Token generation failed');
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
      message: 'Login successful',
    };
  }

  // Todo: add transaction to ensure user creation and token generation are atomic
  async register(registerDto: RegisterDto) {
    const existingUser = await this.userService.findByPhone(registerDto.phone);
    if (existingUser) {
      throw new BadRequestException('User with this phone already exists');
    }

    const user = await this.userService.create(registerDto);

    if (!user) {
      throw new BadRequestException('User registration failed');
    }

    // gererate JWT token
    const payload = { phone: user.phone, id: user.id };
    const token = await this.jwtService.signAsync(payload);

    if (!token) {
      throw new BadRequestException('Token generation failed');
    }

    return { access_token: token, user, message: 'Registration successful' };
  }

  async refreshToken(refreshToken: RefreshTokenDto) {
    const { refreshToken: token } = refreshToken;

    if (!token) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: 'mySecretKey',
      });

      // Generate a new access token
      const newPayload = { phone: payload.phone, id: payload.id };
      const newAccessToken = await this.jwtService.signAsync(newPayload);

      return {
        access_token: newAccessToken,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new BadRequestException('Invalid refresh token');
    }
  }
}
