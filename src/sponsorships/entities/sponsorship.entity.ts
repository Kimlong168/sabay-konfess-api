import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sponsorships' })
export class Sponsorship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 500 })
  image: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ length: 500, nullable: true })
  description: string;
}
