import { Injectable, Logger } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { SendPhotoDto } from './dto/send-photo.dto';
import { SendDocumentDto } from './dto/send-document.dto';
import { UsersService } from 'src/users/users.service';
import { AllExceptionsFilter } from 'src/shared/filters/all-exceptions.filter';
import { BroadcastMessageDto } from './dto/broadcast-message.dto';
import * as TelegramBot from 'node-telegram-bot-api';
import { escapeMarkdown } from 'src/shared/utils/escape-markdown ';
import { Role } from 'src/shared/constants/role.enum';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly exceptionFilter: AllExceptionsFilter,
  ) {}

  onModuleInit() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: true,
    });

    this.bot.onText(/\/start (.+)/, async (msg: any) => {
      const chatId = msg.chat.id;
      try {
        const user = await this.userService.findByChatId(chatId);
        const { name, phone, role } = user;

        // create a new user
        if (!user) {
          const hashPassword = await this.userService.hashPassword(chatId);
          await this.userService.create(
            {
              username: msg.chat?.username,
              password: hashPassword,
              chatId,
              name: msg.chat?.first_name + ' ' + msg.chat?.last_name,
              role: Role.USER,
            },
            null,
          );
        }
        const title = !user
          ? '✅ Your Telegram is now linked'
          : '💟 Your account has been linked already';
        const message =
          `*${title}*\n\n` +
          `*Name:* ${escapeMarkdown(name)}\n` +
          `*Username:* ${escapeMarkdown(msg.chat?.username || '')}\n` +
          `*Phone:* ${escapeMarkdown(phone)}\n` +
          `*Role:* ${escapeMarkdown(role)}\n` +
          `*Chat ID:* \`${chatId}\`\n` +
          `*Confess Link:* \`${process.env.CLIENT_BASE_URL}\`\n` +
          `Copy your confess link and let others confess anonymously. You can now receive messages via this bot\\. Enjoy it🇰🇭✨🎉`;

        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'MarkdownV2',
        });
      } catch (error) {
        this.handleBotException(error, 'Telegram /start handler');
        await this.bot.sendMessage(
          chatId,
          '❌ Something went wrong while linking your Telegram.',
        );
      }
    });

    this.bot.onText(/\/me/, async (msg: any) => {
      const chatId = msg.chat.id;
      try {
        const user = await this.userService.findByChatId(chatId);
        const { name, phone, role } = user;
        const message =
          `💟 *This is your account info*\n\n` +
          `*Name:* ${escapeMarkdown(name)}\n` +
          `*Phone:* ${escapeMarkdown(phone)}\n` +
          `*Role:* ${escapeMarkdown(role)}\n` +
          `*Username:* ${escapeMarkdown(msg.chat?.username || '')}\n` +
          `*Chat ID:* \`${chatId}\`\n` +
          `*Confess Link:* \`https:...\``;

        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'MarkdownV2',
        });
      } catch (error) {
        this.handleBotException(error, 'Telegram /start handler');
        await this.bot.sendMessage(
          chatId,
          '❌ Something went wrong while linking your Telegram.',
        );
      }
    });
  }

  private handleBotException(error: any, contextDescription: string) {
    const fakeHost = {
      switchToHttp: () => ({
        getRequest: () => ({
          url: '/telegram-fake',
          method: 'BOT_EVENT',
          context: contextDescription,
        }),
        getResponse: () => ({
          status: (code) => ({
            json: (data) =>
              this.logger.error(`[${code}] ${JSON.stringify(data)}`),
          }),
        }),
        getNext: () => null,
      }),
      getType: () => 'http',
    };

    this.exceptionFilter.catch(error, fakeHost as any);
  }

  async sendMessage(sendMessageDto: SendMessageDto) {
    const { chatId, message } = sendMessageDto;
    return await this.bot.sendMessage(chatId, message, {
      parse_mode: 'MarkdownV2',
    });
  }

  async sendPhoto(sentPhotoDto: SendPhotoDto) {
    const { chatId, message: caption, photoUrl } = sentPhotoDto;
    return await this.bot.sendPhoto(chatId, photoUrl, {
      caption,
      parse_mode: 'MarkdownV2',
    });
  }

  async sendDocument(sendDocumentDto: SendDocumentDto) {
    const { chatId, message: caption, fileUrl } = sendDocumentDto;
    return await this.bot.sendDocument(chatId, fileUrl, {
      caption,
      parse_mode: 'MarkdownV2',
    });
  }

  async broadcastMessage(broadcastMessageDto: BroadcastMessageDto) {
    const { message, type, photoUrl, fileUrl, limit } = broadcastMessageDto;

    const usersWithChatId = await this.userService.findAllWithChatId(limit);

    const results = await Promise.allSettled(
      usersWithChatId.map((user) => {
        switch (type) {
          case 'photo':
            return this.bot.sendPhoto(user.chatId, photoUrl, {
              caption: message,
              parse_mode: 'MarkdownV2',
            });
          case 'document':
            return this.bot.sendDocument(user.chatId, fileUrl, {
              caption: message,
              parse_mode: 'MarkdownV2',
            });
          default:
            return this.bot.sendMessage(user.chatId, message, {
              parse_mode: 'MarkdownV2',
            });
        }
      }),
    );

    return {
      total: usersWithChatId.length,
      sent: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    };
  }
}
