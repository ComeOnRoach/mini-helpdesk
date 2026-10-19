import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import { User } from '../users/user.entity';
import { CommentsService } from './comments.service';
import { CommentListResponseDto, CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';

const UNAUTHORIZED = {
  status: 401,
  description: 'Missing, invalid or expired token',
  type: ErrorResponseDto,
};
const NOT_FOUND = {
  status: 404,
  description: 'Ticket not found, or it belongs to another user',
  type: ErrorResponseDto,
};

@ApiTags('comments')
@ApiBearerAuth()
@Controller('tickets/:id/comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List comments of a ticket',
    description: 'Oldest first, paginated. A user can read comments only on their own tickets.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Ticket id' })
  @ApiResponse({ status: 200, type: CommentListResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid id or query', type: ErrorResponseDto })
  @ApiResponse(UNAUTHORIZED)
  @ApiResponse(NOT_FOUND)
  list(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListCommentsQueryDto,
  ): Promise<CommentListResponseDto> {
    return this.comments.list(user, id, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a comment to a ticket',
    description: 'A user can comment only on their own tickets; an agent on any ticket.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Ticket id' })
  @ApiResponse({ status: 201, type: CommentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid id or body', type: ErrorResponseDto })
  @ApiResponse(UNAUTHORIZED)
  @ApiResponse(NOT_FOUND)
  create(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.comments.create(user, id, dto);
  }
}
