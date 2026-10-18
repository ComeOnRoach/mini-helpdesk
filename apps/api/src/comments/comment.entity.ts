import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Ticket } from '../tickets/ticket.entity';
import { User } from '../users/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  ticketId: number;

  // Deleting a ticket removes its comments.
  @ManyToOne(() => Ticket, (ticket) => ticket.comments, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Relation<Ticket>;

  @Column({ type: 'int' })
  authorId: number;

  @ManyToOne(() => User, (user) => user.comments, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'authorId' })
  author: Relation<User>;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn()
  createdAt: Date;
}
