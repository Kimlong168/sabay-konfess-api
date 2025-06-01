import { IsNotEmpty, IsString } from 'class-validator';
import { SendMessageDto } from './send-message.dto';

export class SendPhotoDto extends SendMessageDto {
  @IsNotEmpty()
  @IsString()
  readonly photoUrl: string;
}
