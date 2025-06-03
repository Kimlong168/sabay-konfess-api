import { IsOptional, IsString } from 'class-validator';
import { SendMessageDto } from './send-message.dto';

export class SendPhotoDto extends SendMessageDto {
  @IsOptional()
  @IsString()
  readonly photoUrl?: string;
}
