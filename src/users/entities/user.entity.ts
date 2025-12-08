import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { Team } from '../../teams/entities/team.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @OneToOne(() => Team, (team) => team.user)
  team: Team;

  @CreateDateColumn()
  createdAt: Date;
}
