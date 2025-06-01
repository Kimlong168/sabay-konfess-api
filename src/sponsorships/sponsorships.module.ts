import { Module } from '@nestjs/common';
import { SponsorshipsService } from './sponsorships.service';
import { SponsorshipsController } from './sponsorships.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sponsorship } from './entities/sponsorship.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { SponsorshipsRepository } from './sponsorships.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Sponsorship]), CloudinaryModule],
  controllers: [SponsorshipsController],
  providers: [SponsorshipsService, SponsorshipsRepository],
})
export class SponsorshipsModule {}
