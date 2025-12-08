import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Player } from '../../players/entities/player.entity';

@Entity()
export class TransferListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Player, (player) => player.listing)
  @JoinColumn()
  player: Player;

  @Column('int')
  askingPrice: number;

  @CreateDateColumn()
  createdAt: Date;
}
