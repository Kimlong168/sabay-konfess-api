import { Role } from 'src/shared/constants/role.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 50, default: Role.USER })
  role: string;

  @Column({ length: 100, nullable: true })
  chatId: string;

  @Column({ length: 500, nullable: true })
  profileImage: string;
}
