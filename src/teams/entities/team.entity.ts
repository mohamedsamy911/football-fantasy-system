import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Player } from '../../players/entities/player.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.team)
  @JoinColumn()
  user: User;

  @Column({ default: 5000000 })
  budget: number;

  @OneToMany(() => Player, (player) => player.team)
  players: Player[];
}
