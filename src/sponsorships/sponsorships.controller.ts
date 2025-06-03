import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SponsorshipsService } from './sponsorships.service';
import { CreateSponsorshipDto } from './dto/create-sponsorship.dto';
import { UpdateSponsorshipDto } from './dto/update-sponsorship.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { SUCCESS_MESSAGES } from 'src/shared/constants/response-messages';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/constants/role.enum';

@Roles(Role.ADMIN, Role.SUPERADMIN)
@Controller('sponsorships')
export class SponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createSponsorshipDto: CreateSponsorshipDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.sponsorshipsService.create(
      createSponsorshipDto,
      file,
    );
    return { data, message: SUCCESS_MESSAGES.CREATED };
  }

  @Get()
  async findAll() {
    const data = await this.sponsorshipsService.findAll();
    return { data, message: SUCCESS_MESSAGES.FETCHED };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.sponsorshipsService.findOne(id);
    return { data, message: SUCCESS_MESSAGES.FETCHED };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateSponsorshipDto: UpdateSponsorshipDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.sponsorshipsService.update(
      id,
      updateSponsorshipDto,
      file,
    );
    return { data, message: SUCCESS_MESSAGES.UPDATED };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.sponsorshipsService.remove(id);
    return { data, message: SUCCESS_MESSAGES.DELETED };
  }
}
