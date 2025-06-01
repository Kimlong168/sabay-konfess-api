import { Body, Controller, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { Public } from 'src/shared/decorators/public.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { SendPhotoDto } from './dto/send-photo.dto';
import { SendDocumentDto } from './dto/send-document.dto';
import { BroadcastMessageDto } from './dto/broadcast-message.dto';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants/role.enum';
import { SUCCESS_MESSAGES } from 'src/shared/constants/response-messages';

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
  async sendPhoto(@Body() sentPhotoDto: SendPhotoDto) {
    const data = await this.telegramService.sendPhoto(sentPhotoDto);
    return { data, message: SUCCESS_MESSAGES.SENT };
  }

  @Public()
  @Post('document')
  async sendDocument(@Body() sendDocumentDto: SendDocumentDto) {
    const data = await this.telegramService.sendDocument(sendDocumentDto);
    return { data, message: SUCCESS_MESSAGES.SENT };
  }

  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Post('broadcast')
  async broadcastMessage(@Body() broadcastMessageDto: BroadcastMessageDto) {
    const data =
      await this.telegramService.broadcastMessage(broadcastMessageDto);
    return { data, message: SUCCESS_MESSAGES.SENT };
  }
}
