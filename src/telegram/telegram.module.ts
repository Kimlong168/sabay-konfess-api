import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { UsersModule } from 'src/users/users.module';
import { AllExceptionsFilter } from 'src/shared/filters/all-exceptions.filter';
// import { HttpAdapterHost } from '@nestjs/core';
@Module({
  imports: [UsersModule],
  controllers: [TelegramController],
  providers: [TelegramService, AllExceptionsFilter],
  exports: [TelegramService],
})
export class TelegramModule {}
