import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OTPDto {
  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @IsString()
  @IsOptional()
  readonly otp?: string;
}
