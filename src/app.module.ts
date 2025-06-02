import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AccessJwtAuthGuard } from './auth/guards/access-jwt.guard';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { RolesGuard } from './auth/guards/roles.guard';
import { TelegramModule } from './telegram/telegram.module';
import { Session } from './auth/entities/session.entity';
import { MulterModule } from '@nestjs/platform-express';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { SponsorshipsModule } from './sponsorships/sponsorships.module';

import { Sponsorship } from './sponsorships/entities/sponsorship.entity';
// import * as multer from 'multer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Session, Sponsorship],
      synchronize: true, // ⚠️ Disable in production
    }),

    MulterModule.register({
      // storage: multer.memoryStorage(),
      dest: './uploads',
    }),
    CloudinaryModule,
    UsersModule,
    AuthModule,
    TelegramModule,
    SponsorshipsModule,
  ],

  providers: [
    {
      useClass: AccessJwtAuthGuard,
      provide: APP_GUARD,
    },
    {
      useClass: RolesGuard,
      provide: APP_GUARD,
    },
  ],
  controllers: [],
})
export class AppModule {}
