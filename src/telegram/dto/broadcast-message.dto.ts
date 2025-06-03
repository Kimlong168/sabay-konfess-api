import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class BroadcastMessageDto {
  @IsNotEmpty()
  @IsString()
  readonly message: string;

  @IsOptional()
  @IsString()
  readonly type?: string;

  @IsOptional()
  @IsString()
  readonly fileUrl?: string;

  @IsOptional()
  @IsNumber()
  readonly limit?: number;
}
