import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { OTPDto } from './dto/otp.dto';
import { TelegramService } from 'src/telegram/telegram.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly telegramService: TelegramService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByUsername(loginDto.username);
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

    const payload = { id: user.id, username: user.username, role: user.role };

    // Generate access token (short-lived, e.g. 15 min)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    // Generate refresh token (longer-lived, e.g. 7 days)
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });

    if (!accessToken || !refreshToken) {
      throw new BadRequestException('Token generation failed');
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  // Todo: add transaction to ensure user creation and token generation are atomic

  async register(registerDto: RegisterDto, file: Express.Multer.File) {
    const existingUser = await this.userService.findByPhone(registerDto.phone);
    if (existingUser) {
      throw new BadRequestException('User with this phone already exists');
    }

    const user = await this.userService.create(registerDto, file);

    if (!user) {
      throw new BadRequestException('User registration failed');
    }

    const payload = { id: user.id, username: user.username, role: user.role };

    // Generate access token (short-lived, e.g. 15 min)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15mn',
    });

    // Generate refresh token (longer-lived, e.g. 7 days)
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });

    if (!accessToken || !refreshToken) {
      throw new BadRequestException('Token generation failed');
    }

    return { access_token: accessToken, refresh_token: refreshToken, user };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      // Verify the refresh token
      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      const payload = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      };

      const newAccessToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      });

      const newRefreshToken = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new BadRequestException('Invalid or expired refresh token');
    }
  }

  async requestOtp(otpDto: OTPDto) {
    const { username } = otpDto;

    const user = await this.userService.findByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.chatId) {
      throw new NotFoundException(
        'This user has not binded with the telegram bot yet!',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes
    const message = `
      *សួរស្តី, ${user.name}\\!*
      \nលេខកូដ OTP របស់អ្នកគឺ: \`${otp}\`
      \nសូមប្រើលេខកូដនេះដើម្បីបញ្ចប់ដំណើរការរបស់អ្នក។
      \n⚠️ *ហាមចែករំលែកលេខកូដនេះជាមួយអ្នកណាផ្សេង៕*
      `.trim();

    // Save OTP in the session table
    await this.sessionRepository.save({
      username,
      otp,
      expiresAt,
    });

    return await this.telegramService.sendMessage({
      chatId: user.chatId,
      message,
    });
  }

  async verifyOtp(otpDto: OTPDto) {
    const { username, otp } = otpDto;

    const session = await this.sessionRepository.findOne({
      where: { username, otp },
    });

    if (!session) {
      throw new NotFoundException('OTP is not valid');
    }

    // Remove otp from db
    await this.sessionRepository.delete({ username });
    if (new Date() > session.expiresAt) {
      throw new NotFoundException('OTP is expired');
    }

    return otpDto;
  }
}
