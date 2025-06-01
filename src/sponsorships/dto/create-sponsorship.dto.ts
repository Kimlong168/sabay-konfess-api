import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSponsorshipDto {
  @IsNotEmpty()
  @IsString()
  readonly type: string; //banner, logo

  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsString()
  readonly description?: string;
}
