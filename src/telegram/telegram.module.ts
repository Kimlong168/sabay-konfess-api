import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { UsersModule } from 'src/users/users.module';
import { AllExceptionsFilter } from 'src/shared/filters/all-exceptions.filter';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
@Module({
  imports: [UsersModule, CloudinaryModule],
  controllers: [TelegramController],
  providers: [TelegramService, AllExceptionsFilter],
  exports: [TelegramService],
})
export class TelegramModule {}
