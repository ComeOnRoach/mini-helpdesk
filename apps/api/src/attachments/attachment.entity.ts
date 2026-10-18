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

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  ticketId: number;

  // Deleting a ticket removes its attachment records.
  @ManyToOne(() => Ticket, (ticket) => ticket.attachments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: Relation<Ticket>;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 500 })
  path: string;

  @Column({ type: 'varchar', length: 255 })
  mime: string;

  // Size in bytes.
  @Column({ type: 'int', unsigned: true })
  size: number;

  @CreateDateColumn()
  createdAt: Date;
}
