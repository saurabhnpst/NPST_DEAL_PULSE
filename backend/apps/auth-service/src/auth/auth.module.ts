import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { MeController } from './me.controller';
import { UsersController } from './users.controller';
import { LocalIdentityService } from '../users/local-identity.service';
import { SessionStoreService } from '../session/session-store.service';

@Module({
  controllers: [AuthController, MeController, UsersController],
  providers: [LocalIdentityService, SessionStoreService],
})
export class AuthModule {}