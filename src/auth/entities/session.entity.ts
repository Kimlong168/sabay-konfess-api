import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}
