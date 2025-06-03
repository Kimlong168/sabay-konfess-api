import { IsOptional, IsString } from 'class-validator';
import { SendMessageDto } from './send-message.dto';

export class SendDocumentDto extends SendMessageDto {
  @IsOptional()
  @IsString()
  readonly fileUrl?: string;
}
