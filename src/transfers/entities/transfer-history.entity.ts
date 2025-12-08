import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Player } from '../../players/entities/player.entity';
import { Team } from '../../teams/entities/team.entity';

@Entity()
export class TransferHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Player, (player) => player.transferHistory)
  player: Player;

  @ManyToOne(() => Team, (team) => team.transferHistory)
  fromTeam: Team;

  @ManyToOne(() => Team, (team) => team.transferHistory)
  toTeam: Team;

  @Column('int')
  price: number;

  @CreateDateColumn()
  transferredAt: Date;
}
