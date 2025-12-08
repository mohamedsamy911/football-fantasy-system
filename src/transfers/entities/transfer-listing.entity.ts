import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Player } from '../../players/entities/player.entity';

@Entity()
@Unique(['player'])
@Index(['askingPrice'])
@Index(['createdAt'])
export class TransferListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Player, (player) => player.listing, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  player: Player;

  @Column('int')
  askingPrice: number;

  @CreateDateColumn()
  createdAt: Date;
}
