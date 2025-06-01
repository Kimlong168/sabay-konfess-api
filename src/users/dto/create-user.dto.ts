import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/shared/constants/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;

  @IsNotEmpty()
  @IsString()
  readonly role: Role;

  @IsString()
  @IsOptional()
  readonly phone?: string;

  @IsString()
  @IsOptional()
  readonly chatId?: string;
}
