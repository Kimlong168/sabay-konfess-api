import { IsNotEmpty, IsString } from 'class-validator';
import { SendMessageDto } from './send-message.dto';

export class SendDocumentDto extends SendMessageDto {
  @IsNotEmpty()
  @IsString()
  readonly fileUrl: string;
}
