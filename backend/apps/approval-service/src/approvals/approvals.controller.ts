import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
  parseRejectApprovalInput,
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

  @Get()
  list(@Actor() actor: MockActor): Promise<ApprovalRequest[]> {
    return this.lifecycle.listApprovals(actor);
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
