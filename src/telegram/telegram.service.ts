import { Injectable, Logger } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { SendPhotoDto } from './dto/send-photo.dto';
import { SendDocumentDto } from './dto/send-document.dto';
import { UsersService } from 'src/users/users.service';
import { AllExceptionsFilter } from 'src/shared/filters/all-exceptions.filter';
import { BroadcastMessageDto } from './dto/broadcast-message.dto';
import { escapeMarkdown } from 'src/shared/utils/escape-markdown ';
import { Role } from 'src/shared/constants/role.enum';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly exceptionFilter: AllExceptionsFilter,
    private configService: ConfigService,
  ) {}

  readonly TELEGRAM_BOT_TOKEN =
    this.configService.get<string>('TELEGRAM_BOT_TOKEN');
  readonly CLIENT_BASE_URL = this.configService.get<string>('CLIENT_BASE_URL');
  readonly TELEGRAM_CHAT_ID =
    this.configService.get<string>('TELEGRAM_CHAT_ID');

  onModuleInit() {
    this.bot = new TelegramBot(this.TELEGRAM_BOT_TOKEN, {
      polling: true,
    });

    this.bot.onText(/\/(bind|start)/, async (msg: any) => {
      const { username, first_name, last_name, id: chatId } = msg.chat;

      try {
        const user = await this.userService.findByChatId(chatId);
        // create a new user
        if (!user) {
          const hashPassword = await this.userService.hashPassword(
            chatId.toString(),
          );
          await this.userService.create(
            {
              name: first_name + ' ' + last_name,
              username: username,
              password: hashPassword,
              chatId,
              role: Role.USER,
            },
            null,
          );
        }
        const title = !user
          ? '✅ Your Telegram is now linked'
          : '💟 Your account has been linked already';

        const message =
          `*${escapeMarkdown(title)}*\n\n` +
          `*Name:* ${escapeMarkdown(first_name + ' ' + last_name)}\n` +
          `*Username:* ${escapeMarkdown(username)}\n` +
          `*Chat ID:* \`${escapeMarkdown(chatId)}\`\n` +
          `*Confess Link:* \`${this.CLIENT_BASE_URL}/${username}/${chatId}\`\n\n` +
          `Copy your confess link and let others confess anonymously\\. You can now receive messages via this bot\\. Enjoy it🇰🇭✨🎉`;

        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'MarkdownV2',
        });

        // await this.bot.sendMessage(this.TELEGRAM_CHAT_ID, message, {
        //   parse_mode: 'MarkdownV2',
        // });
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
        const { name, role, username } = user;
        const message =
          `💟 *This is your account info*\n\n` +
          `*Name:* ${escapeMarkdown(name)}\n` +
          `*Role:* ${escapeMarkdown(role)}\n` +
          `*Username:* ${escapeMarkdown(username)}\n` +
          `*Chat ID:* \`${chatId}\`\n` +
          `*Confess Link:* \`${this.CLIENT_BASE_URL}/${username}/${chatId}\`\n\n`;

        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'MarkdownV2',
        });
      } catch (error) {
        this.handleBotException(error, 'Telegram /start handler');
        await this.bot.sendMessage(
          chatId,
          'type /start to link your telegram account first!',
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
    const timestamp = Date.now();
    const text = `[${message}](${this.CLIENT_BASE_URL}/preview?message=${message}&time=${timestamp})`;

    return await this.bot.sendMessage(chatId, text, {
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
