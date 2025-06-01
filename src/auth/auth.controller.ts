import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from 'src/shared/decorators/public.decorator';
import { OTPDto } from './dto/otp.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return { data, message: 'Login successfully' };
  }

  @Post('register')
  @UseInterceptors(FileInterceptor('profileImage'))
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(file);
    const data = await this.authService.register(registerDto, file);
    return { data, message: 'Register successfully' };
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const data = await this.authService.refreshToken(refreshTokenDto);
    return { data, message: 'Refresh successfully' };
  }

  @Post('request-otp')
  async requestOtp(@Body() otpDto: OTPDto) {
    const data = await this.authService.requestOtp(otpDto);
    return { data, message: 'Request OTP successfully' };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() otpDto: OTPDto) {
    const data = await this.authService.verifyOtp(otpDto);
    return { data, message: 'Verify OTP successfully' };
  }
}
