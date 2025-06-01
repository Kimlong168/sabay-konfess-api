import { Injectable } from '@nestjs/common';
import { AbstractRepository } from 'src/shared/repository.abstract';
import { EntityManager } from 'typeorm';
import { Sponsorship } from './entities/sponsorship.entity';

@Injectable()
export class SponsorshipsRepository extends AbstractRepository<Sponsorship> {
  constructor(protected readonly entityManager: EntityManager) {
    super(Sponsorship, entityManager);
  }
}
