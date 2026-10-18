import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { UserRole } from '../common/enums';
import { Comment } from '../comments/comment.entity';
import { Ticket } from '../tickets/ticket.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // Never returned in responses; login (T2.1) loads it explicitly with addSelect.
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Ticket, (ticket) => ticket.createdBy)
  createdTickets: Relation<Ticket>[];

  @OneToMany(() => Ticket, (ticket) => ticket.assignee)
  assignedTickets: Relation<Ticket>[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Relation<Comment>[];
}
