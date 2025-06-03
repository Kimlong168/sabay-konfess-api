import { IsNotEmpty, IsString } from 'class-validator';
import { BroadcastMessageDto } from './broadcast-message.dto';

export class SendConfessionDto extends BroadcastMessageDto {
  @IsNotEmpty()
  @IsString()
  readonly chatId: string;
}
