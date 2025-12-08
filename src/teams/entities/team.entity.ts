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
import { TEAM_CONSTRAINTS } from '../../config/constants';
import { TransferHistory } from '../../transfers/entities/transfer-history.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.team)
  @JoinColumn()
  user: User;

  @Column({
    type: 'bigint',
    default: TEAM_CONSTRAINTS.INITIAL_BUDGET,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseInt(value, 10),
    },
  })
  budget: number;

  @OneToMany(() => Player, (player) => player.team)
  players: Player[];

  @OneToMany(() => TransferHistory, (history) => history.fromTeam)
  transferHistory: TransferHistory[];
}
