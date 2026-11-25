import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApprovalLifecycleService } from './approval-lifecycle.service';
import {
  ApprovalHistoryEvent,
  ApprovalRequest,
} from './approval.types';
import {
  parseApproveApprovalInput,
  parseListApprovalsQuery,
  parseReassignApprovalInput,
  parseRejectApprovalInput,
  parseSubmitApprovalInput,
} from '../dto/approval.dto';
import { Actor } from '../mock/actor.decorator';
import { ActorContextRequest, MockActor } from '../mock/actor.types';
import { MockActorGuard } from '../mock/mock-actor.guard';
import { headerValue } from '../shared/http';
import { notImplementedError } from '../shared/errors';

@Controller('approvals')
@UseGuards(MockActorGuard)
export class ApprovalsController {
  constructor(private readonly lifecycle: ApprovalLifecycleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() body: unknown, @Actor() actor: MockActor) {
    const input = parseSubmitApprovalInput(body);
    if (input.creatorId !== actor.actorId && actor.role !== 'ADMIN') {
      input.creatorId = actor.actorId;
    }
    return this.lifecycle.submit(input);
  }

  @Get()
  list(
    @Actor() actor: MockActor,
    @Query() query: Record<string, string | undefined>,
  ): Promise<ApprovalRequest[]> {
    const parsed = parseListApprovalsQuery(query);
    const filter = {
      ...(parsed.status ? { status: parsed.status as ApprovalRequest['status'] } : {}),
      ...(parsed.leadId ? { leadId: parsed.leadId } : {}),
      ...(parsed.requesterId ? { creatorId: parsed.requesterId } : {}),
      ...(parsed.approverId ? { currentApproverId: parsed.approverId } : {}),
    };
    return this.lifecycle.listApprovals(actor, filter);
  }

  @Get('pending')
  pending(@Actor() actor: MockActor): Promise<ApprovalRequest[]> {
    return this.lifecycle.pendingApprovals(actor);
  }

  @Get(':id/history')
  history(
    @Param('id') id: string,
    @Actor() actor: MockActor,
  ): Promise<ApprovalHistoryEvent[]> {
    return this.lifecycle.getHistory(id, actor);
  }

  @Get(':id')
  get(@Param('id') id: string, @Actor() actor: MockActor): Promise<ApprovalRequest> {
    return this.lifecycle.getApproval(id, actor);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @Actor() actor: MockActor,
    @Body() body: unknown,
    @Req() request: ActorContextRequest,
  ) {
    return this.lifecycle.approve(
      id,
      actor,
      parseApproveApprovalInput(body),
      this.key(request, id, 'APPROVED'),
    );
  }

  @Post(':id/reassign')
  @HttpCode(HttpStatus.OK)
  reassign(
    @Param('id') id: string,
    @Actor() actor: MockActor,
    @Body() body: unknown,
    @Req() request: ActorContextRequest,
  ) {
    return this.lifecycle.reassign(
      id,
      actor,
      parseReassignApprovalInput(body),
      this.key(request, id, 'REASSIGNED'),
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @Actor() actor: MockActor,
    @Body() body: unknown,
    @Req() request: ActorContextRequest,
  ) {
    return this.lifecycle.reject(
      id,
      actor,
      parseRejectApprovalInput(body),
      this.key(request, id, 'REJECTED'),
    );
  }

  @Post(':id/request-changes')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  requestChanges(): never {
    throw notImplementedError('Request changes is not implemented');
  }

  private key(request: ActorContextRequest, id: string, outcome: string): string {
    return headerValue(request.headers, 'idempotency-key') ?? `${id}:${outcome}`;
  }
}
