import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import authConfig from './config/auth.config';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';

// Each auth endpoint (me, csrf, logout) validates the session itself, so no global guard is needed.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), 'apps/auth-service/.env'),
      load: [authConfig],
    }),
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
