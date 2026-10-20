import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { TicketStatus } from '../../common/enums';
import { CreateTicketDto } from './create-ticket.dto';

// Every field is optional; at least one must be sent (checked in TicketsService).
export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiPropertyOptional({
    enum: TicketStatus,
    description: 'Agents only',
    example: TicketStatus.InProgress,
  })
  @IsEnum(TicketStatus, {
    message: `status must be one of: ${Object.values(TicketStatus).join(', ')}`,
  })
  @IsOptional()
  status?: TicketStatus;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Agents only. The id of an agent, or null to unassign',
    example: 2,
  })
  @IsInt({ message: 'assigneeId must be a whole number or null' })
  @Min(1, { message: 'assigneeId must be at least 1' })
  @IsOptional()
  assigneeId?: number | null;
}
