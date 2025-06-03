import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSponsorshipDto } from './dto/create-sponsorship.dto';
import { UpdateSponsorshipDto } from './dto/update-sponsorship.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { SponsorshipsRepository } from './sponsorships.repository';

@Injectable()
export class SponsorshipsService {
  constructor(
    private readonly sponsorshipsRepository: SponsorshipsRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createSponsorshipDto: CreateSponsorshipDto,
    file: Express.Multer.File,
  ) {
    const sponsorEntity =
      this.sponsorshipsRepository.create(createSponsorshipDto);

    if (file) {
      const image = await this.cloudinaryService.uploadFile(file);
      sponsorEntity.image = image.secure_url;
    }

    const sponsor = await this.sponsorshipsRepository.save(sponsorEntity);

    if (!sponsor) {
      throw new BadRequestException('Sponsor not created');
    }

    return sponsor;
  }

  async findAll() {
    return await this.sponsorshipsRepository.find();
  }

  async findOne(id: string) {
    const sponsor = await this.sponsorshipsRepository.findOne({
      where: { id },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    return sponsor;
  }

  async update(
    id: string,
    updateSponsorshipDto: UpdateSponsorshipDto,
    file: Express.Multer.File,
  ) {
    const sponsor = await this.sponsorshipsRepository.findOne({
      where: { id },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    if (file) {
      const image = await this.cloudinaryService.uploadFile(file);
      sponsor.image = image.secure_url;
    }

    const savedSponsor = await this.sponsorshipsRepository.save({
      ...sponsor,
      ...updateSponsorshipDto,
    });

    if (!savedSponsor) {
      throw new BadRequestException('Sponsor not updated');
    }
    return savedSponsor;
  }

  async remove(id: string) {
    const sponsor = await this.sponsorshipsRepository.findOne({
      where: { id },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    const deletedSponsor = await this.sponsorshipsRepository.remove(sponsor);

    if (!deletedSponsor) {
      throw new BadRequestException('Sponsor not deleted');
    }

    return deletedSponsor;
  }
}
