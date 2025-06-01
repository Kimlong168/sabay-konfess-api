import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/access-jwt.strategy';
import { TelegramModule } from 'src/telegram/telegram.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';

@Module({
  imports: [
    UsersModule,
    TelegramModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    TypeOrmModule.forFeature([Session]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
