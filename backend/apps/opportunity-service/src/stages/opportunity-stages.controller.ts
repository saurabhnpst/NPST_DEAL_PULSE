import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { StageTransitionService } from './stage-transition.service';
import { HoldOpportunityDto } from './dto/hold-opportunity.dto';
import { CloseWonDto } from './dto/close-won.dto';
import { CloseLostDto } from './dto/close-lost.dto';
import { CloseNoBidDto } from './dto/close-no-bid.dto';
import { ReopenOpportunityDto } from './dto/reopen-opportunity.dto';
import { StageActorDto } from './dto/stage-actor.dto';

@Controller('opportunities/:id')
export class OpportunityStagesController {
  constructor(private readonly stages: StageTransitionService) {}

  @Get('stages')
  async currentStage(@Param('id') id: string) {
    return ok(await this.stages.getStageContext(id));
  }

  @Post('stages/:stageId/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
  ) {
    return ok(await this.stages.completeStage(id, stageId));
  }

  @Post('stages/:stageId/proceed')
  @HttpCode(HttpStatus.OK)
  async proceed(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body() body: StageActorDto,
    @ActorId() actor?: number,
  ) {
    const data = await this.stages.proceed(id, stageId, pickActor(actor, body.changedByUserId));
    return ok(data);
  }

  @Post('hold')
  @HttpCode(HttpStatus.OK)
  async hold(@Param('id') id: string, @Body() body: HoldOpportunityDto, @ActorId() actor?: number) {
    const data = await this.stages.hold(id, { ...body, changedByUserId: pickActor(actor, body.changedByUserId) });
    return ok(data);
  }

  @Post('close-won')
  @HttpCode(HttpStatus.OK)
  async closeWon(@Param('id') id: string, @Body() body: CloseWonDto, @ActorId() actor?: number) {
    const data = await this.stages.closeWon(id, { ...body, changedByUserId: pickActor(actor, body.changedByUserId) });
    return ok(data);
  }

  @Post('close-lost')
  @HttpCode(HttpStatus.OK)
  async closeLost(@Param('id') id: string, @Body() body: CloseLostDto, @ActorId() actor?: number) {
    const data = await this.stages.closeLost(id, { ...body, changedByUserId: pickActor(actor, body.changedByUserId) });
    return ok(data);
  }

  @Post('close-no-bid')
  @HttpCode(HttpStatus.OK)
  async closeNoBid(@Param('id') id: string, @Body() body: CloseNoBidDto, @ActorId() actor?: number) {
    const data = await this.stages.closeNoBid(id, { ...body, changedByUserId: pickActor(actor, body.changedByUserId) });
    return ok(data);
  }

  @Post('reopen')
  @HttpCode(HttpStatus.OK)
  async reopen(@Param('id') id: string, @Body() body: ReopenOpportunityDto, @ActorId() actor?: number) {
    const data = await this.stages.reopen(id, { ...body, changedByUserId: pickActor(actor, body.changedByUserId) });
    return ok(data);
  }
}