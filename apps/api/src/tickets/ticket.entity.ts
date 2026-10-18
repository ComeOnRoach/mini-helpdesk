import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Attachment } from '../attachments/attachment.entity';
import { TicketPriority, TicketStatus } from '../common/enums';
import { Comment } from '../comments/comment.entity';
import { User } from '../users/user.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Index('IDX_tickets_status')
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.Open })
  status: TicketStatus;

  @Index('IDX_tickets_priority')
  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.Medium })
  priority: TicketPriority;

  // JSON array of strings, filtered with JSON_CONTAINS (T3.1). No DB default: MySQL reports an
  // expression default differently from TypeORM, which makes migration:generate never settle.
  // The service sets [] when no tags are given.
  @Column({ type: 'json' })
  tags: string[];

  @Index('IDX_tickets_created_by')
  @Column({ type: 'int' })
  createdById: number;

  @ManyToOne(() => User, (user) => user.createdTickets, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy: Relation<User>;

  @Column({ type: 'int', nullable: true })
  assigneeId: number | null;

  @ManyToOne(() => User, (user) => user.assignedTickets, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigneeId' })
  assignee: Relation<User> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Comment, (comment) => comment.ticket)
  comments: Relation<Comment>[];

  @OneToMany(() => Attachment, (attachment) => attachment.ticket)
  attachments: Relation<Attachment>[];
}
