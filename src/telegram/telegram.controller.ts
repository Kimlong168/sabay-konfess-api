import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { Public } from 'src/shared/decorators/public.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { SendPhotoDto } from './dto/send-photo.dto';
import { SendDocumentDto } from './dto/send-document.dto';
import { BroadcastMessageDto } from './dto/broadcast-message.dto';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants/role.enum';
import { SUCCESS_MESSAGES } from 'src/shared/constants/response-messages';
import { FileInterceptor } from '@nestjs/platform-express';
import { SendConfessionDto } from './dto/send-confession.dto';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Public()
  @Post('message')
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    const data = await this.telegramService.sendMessage(sendMessageDto);
    return { data, message: SUCCESS_MESSAGES.SENT };
  }

  @Public()
  @Post('photo')
  @UseInterceptors(FileInterceptor('image'))
  async sendPhoto(
    @Body() sentPhotoDto: SendPhotoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.telegramService.sendPhoto(sentPhotoDto, file);
    return { data, message: SUCCESS_MESSAGES.SENT };
  }

  @Public()
  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async sendDocument(
    @Body() sendDocumentDto: SendDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.telegramService.sendDocument(sendDocumentDto, file);
    return { data, message: SUCCESS_MESSAGES.SENT };
  }

  @Public()
  @Post('confession')
  @UseInterceptors(FileInterceptor('file'))
  async sendConfession(
    @Body() sendConfessionDto: SendConfessionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.telegramService.sendConfession(
      sendConfessionDto,
      file,
    );
    return { data, message: SUCCESS_MESSAGES.SENT };
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Post('broadcast')
  @UseInterceptors(FileInterceptor('file'))
  async broadcastMessage(
    @Body() broadcastMessageDto: BroadcastMessageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.telegramService.broadcastMessage(
      broadcastMessageDto,
      file,
    );
    return { data, message: SUCCESS_MESSAGES.SENT };
  }
}
