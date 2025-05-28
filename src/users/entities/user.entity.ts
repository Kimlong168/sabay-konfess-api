import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50 })
  phone: string;

  @Column({ length: 50 })
  role: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 100, nullable: true })
  chatId: string;

  @Column({ length: 255, nullable: true })
  profileImage: string;
}
