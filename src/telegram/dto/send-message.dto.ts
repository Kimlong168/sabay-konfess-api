import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  readonly message: string;

  @IsNotEmpty()
  @IsString()
  readonly chatId: string;
}
