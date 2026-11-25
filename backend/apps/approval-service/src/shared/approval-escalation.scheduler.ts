import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ApprovalLifecycleService } from '../approvals/approval-lifecycle.service';
import { ApprovalConfigService } from './config';
import { DomainError } from './errors';

const ESCALATION_INTERVAL_MS = 60_000;

@Injectable()
export class ApprovalEscalationScheduler implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly lifecycle: ApprovalLifecycleService,
    private readonly config: ApprovalConfigService,
  ) {}

  onModuleInit(): void {
    if (!this.config.escalationEnabled) {
      return;
    }
    this.timer = setInterval(() => {
      void this.lifecycle.escalateAllDue().catch((error: unknown) => {
        const code = error instanceof DomainError ? error.code : 'ESCALATION_FAILED';
        process.stderr.write(`${code}\n`);
      });
    }, ESCALATION_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
    }
  }
}
