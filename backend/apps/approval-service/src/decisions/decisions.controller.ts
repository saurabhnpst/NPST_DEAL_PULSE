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
import { ApprovalLifecycleService } from '../approvals/approval-lifecycle.service';
import { Decision, PendingDecisionView } from './decision.types';
import { parseApproveApprovalInput, parseRejectApprovalInput } from '../dto/approval.dto';
import { Actor } from '../mock/actor.decorator';
import { ActorContextRequest, MockActor } from '../mock/actor.types';
import { MockActorGuard } from '../mock/mock-actor.guard';
import { notImplementedError } from '../shared/errors';
import { headerValue } from '../shared/http';

@Controller('decisions')
@UseGuards(MockActorGuard)
export class DecisionsController {
  constructor(private readonly lifecycle: ApprovalLifecycleService) {}

  @Get()
  list(@Actor() actor: MockActor): Promise<Decision[]> {
    return this.lifecycle.listDecisions(actor);
  }

  @Get('pending')
  pending(@Actor() actor: MockActor): Promise<PendingDecisionView[]> {
    return this.lifecycle.pendingDecisions(actor);
  }

  @Get(':id')
  get(@Param('id') id: string, @Actor() actor: MockActor): Promise<Decision> {
    return this.lifecycle.getDecision(id, actor);
  }

  @Post(':id/recommendation')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  recommendation(): never {
    throw notImplementedError('Sales recommendation is not implemented');
  }

  @Post(':id/proceed')
  @HttpCode(HttpStatus.OK)
  proceed(
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

  private key(request: ActorContextRequest, id: string, outcome: string): string {
    return headerValue(request.headers, 'idempotency-key') ?? `${id}:${outcome}`;
  }
}
