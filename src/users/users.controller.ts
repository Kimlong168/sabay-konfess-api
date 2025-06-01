import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants/role.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SUCCESS_MESSAGES } from 'src/shared/constants/response-messages';

@Roles(Role.ADMIN, Role.SUPERADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('profileImage'))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.usersService.create(createUserDto, file);
    return { data, message: SUCCESS_MESSAGES.CREATED };
  }

  @Get()
  async findAll() {
    const data = await this.usersService.findAll();
    return { data, message: SUCCESS_MESSAGES.FETCHED };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { data, message: SUCCESS_MESSAGES.FETCHED };
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('profileImage'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.usersService.update(id, updateUserDto, file);
    return { data, message: SUCCESS_MESSAGES.UPDATED };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.usersService.remove(id);
    return { data, message: SUCCESS_MESSAGES.DELETED };
  }
}
