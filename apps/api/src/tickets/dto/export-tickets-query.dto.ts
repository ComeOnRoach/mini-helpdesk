import { OmitType } from '@nestjs/swagger';
import { ListTicketsQueryDto } from './list-tickets-query.dto';

// The same filters and sort as the list; the export is not paginated.
export class ExportTicketsQueryDto extends OmitType(ListTicketsQueryDto, ['page', 'limit']) {}
