import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AccessJwtAuthGuard } from './auth/guards/access-jwt.guard';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'example',
      database: 'nestdb',
      entities: [User],
      // entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // autoLoadEntities: true,
      synchronize: true, // Note: set to false in production
    }),
    UsersModule,
    AuthModule,
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
