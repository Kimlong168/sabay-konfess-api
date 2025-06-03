import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { SendConfessionDto } from './dto/send-confession.dto';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
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
      const fullName = `${first_name ?? ''} ${last_name ?? ''}`.trim();

      try {
        const user = await this.userService.findByChatId(chatId);
        // create a new user
        if (!user) {
          const hashPassword = await this.userService.hashPassword(
            chatId.toString(),
          );
          await this.userService.create(
            {
              name: fullName,
              username: username,
              password: hashPassword,
              chatId,
              role: Role.USER,
            },
            null,
          );

          const message =
            `*New User Registered*\n\n` +
            `*Name:* ${escapeMarkdown(fullName)}\n` +
            `*Username:* ${escapeMarkdown(username)}\n` +
            `*Chat ID:* \`${escapeMarkdown(chatId)}\`\n` +
            `*Confess Link:* \`${this.CLIENT_BASE_URL}/${username}/${chatId}\`\n\n`;
          await this.bot.sendMessage(this.TELEGRAM_CHAT_ID, message, {
            parse_mode: 'MarkdownV2',
          });
        }

        const title = !user
          ? '✅ Your Telegram is now linked'
          : '💟 Your account has been linked already';

        const message =
          `*${escapeMarkdown(title)}*\n\n` +
          `*Name:* ${escapeMarkdown(fullName)}\n` +
          `*Username:* ${escapeMarkdown(username)}\n` +
          `*Chat ID:* \`${escapeMarkdown(chatId)}\`\n` +
          `*Confess Link:* \`${this.CLIENT_BASE_URL}/${username}/${chatId}\`\n\n` +
          `Copy your confess link and let others confess anonymously\\. You can now receive messages via this bot\\. Enjoy it🇰🇭✨🎉`;

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

  async sendConfession(
    sendConfessionDto: SendConfessionDto,
    file?: Express.Multer.File,
  ) {
    const { message, fileUrl, type, chatId } = sendConfessionDto;
    let document = fileUrl;
    let uploadedFile: { secure_url: string; public_id: string } | null = null;

    try {
      if (file && type !== 'message') {
        uploadedFile = await this.cloudinaryService.uploadFile(file);
        document = uploadedFile.secure_url;
      }

      const timestamp = Date.now();
      const escapedText = escapeMarkdown(message);
      const encodedMessage = encodeURIComponent(message);
      const newMessage = `[${escapedText}](${this.CLIENT_BASE_URL}/preview?message=${encodedMessage}&time=${timestamp})`;

      switch (type) {
        case 'photo':
          return await this.bot.sendPhoto(chatId, document, {
            caption: newMessage,
            parse_mode: 'MarkdownV2',
          });
        case 'document':
          return await this.bot.sendDocument(chatId, document, {
            caption: newMessage,
            parse_mode: 'MarkdownV2',
          });
        default:
          return await this.bot.sendMessage(chatId, newMessage, {
            parse_mode: 'MarkdownV2',
          });
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      if (uploadedFile?.public_id) {
        try {
          await this.cloudinaryService.deleteFile(uploadedFile.public_id);
        } catch (cleanupError) {
          console.warn('Failed to delete image from Cloudinary:', cleanupError);
        }
      }
    }
  }

  async sendMessage(sendMessageDto: SendMessageDto) {
    const { chatId, message } = sendMessageDto;

    return await this.bot.sendMessage(chatId, message);
  }

  async sendPhoto(sentPhotoDto: SendPhotoDto, file?: Express.Multer.File) {
    const { chatId, message, photoUrl } = sentPhotoDto;
    let photo = photoUrl;
    let uploadedImage: { secure_url: string; public_id: string } | null = null;

    try {
      // If a file is uploaded, upload to Cloudinary
      if (file) {
        uploadedImage = await this.cloudinaryService.uploadFile(file);
        photo = uploadedImage.secure_url;
      }

      // Validate that we have a valid photo URL to send
      if (!photo) {
        throw new NotFoundException('Invalid file URL to send');
      }

      return await this.bot.sendPhoto(chatId, photo, {
        caption: message,
      });
    } catch (error) {
      throw new BadRequestException('Error:' + error.message);
    } finally {
      // Clean up uploaded image if present
      if (uploadedImage?.public_id) {
        try {
          await this.cloudinaryService.deleteFile(uploadedImage.public_id);
        } catch (cleanupError) {
          console.warn('Failed to delete image from Cloudinary:', cleanupError);
        }
      }
    }
  }

  async sendDocument(
    sendDocumentDto: SendDocumentDto,
    file?: Express.Multer.File,
  ) {
    const { chatId, message, fileUrl } = sendDocumentDto;
    let document = fileUrl;
    let uploadedFile: { secure_url: string; public_id: string } | null = null;

    try {
      // If a file is uploaded, upload to Cloudinary
      if (file) {
        uploadedFile = await this.cloudinaryService.uploadFile(file);
        document = uploadedFile.secure_url;
        console.log(uploadedFile);
      }

      // Validate that we have a valid photo URL to send
      if (!document) {
        throw new NotFoundException('Invalid file URL to send');
      }

      return await this.bot.sendDocument(chatId, document, {
        caption: message,
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      if (uploadedFile?.public_id) {
        try {
          await this.cloudinaryService.deleteFile(uploadedFile.public_id);
        } catch (cleanupError) {
          console.warn('Failed to delete image from Cloudinary:', cleanupError);
        }
      }
    }
  }

  async broadcastMessage(
    broadcastMessageDto: BroadcastMessageDto,
    file?: Express.Multer.File,
  ) {
    const { message, fileUrl, limit, type } = broadcastMessageDto;
    let document = fileUrl;
    let uploadedFile: { secure_url: string; public_id: string } | null = null;

    try {
      const usersWithChatId = await this.userService.findAllWithChatId(limit);

      if (file && type !== 'message') {
        uploadedFile = await this.cloudinaryService.uploadFile(file);
        document = uploadedFile.secure_url;
      }

      const results = await Promise.allSettled(
        usersWithChatId.map((user) => {
          switch (type) {
            case 'photo':
              return this.bot.sendPhoto(user.chatId, document, {
                caption: message,
              });
            case 'document':
              return this.bot.sendDocument(user.chatId, document, {
                caption: message,
              });
            default:
              return this.bot.sendMessage(user.chatId, message);
          }
        }),
      );

      return {
        total: usersWithChatId.length,
        sent: results.filter((r) => r.status === 'fulfilled').length,
        failed: results.filter((r) => r.status === 'rejected').length,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      if (uploadedFile?.public_id) {
        try {
          await this.cloudinaryService.deleteFile(uploadedFile.public_id);
        } catch (cleanupError) {
          console.warn('Failed to delete image from Cloudinary:', cleanupError);
        }
      }
    }
  }
}
