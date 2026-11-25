import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ACTOR_HEADER } from './common/constants/compliance.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs'],
  });
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('DealPlus Compliance Service API')
    .setDescription(
      'Compliance Service MVP: frameworks, requirements, configurations, assessments, matrix, gap analysis, evidence references, reviews, and sign-offs. ' +
        `Actor identity may be passed via the \`${ACTOR_HEADER}\` header until the shared JWT module (libs/security) is integrated. ` +
        'No auth guards are enabled in this service.',
    )
    .setVersion('1.0')
    .addTag('Health', 'Service liveness and readiness probes')
    .addTag('Frameworks', 'Compliance framework catalog (standards and sources)')
    .addTag('Requirements', 'Requirement library entries under a framework')
    .addTag(
      'Configurations',
      'Project/opportunity compliance packs with framework and requirement selection',
    )
    .addTag(
      'Assessments',
      'Opportunity compliance assessments driven by a configuration (Draft→InProgress→InReview→Completed)',
    )
    .addTag(
      'Matrix',
      'Per-requirement compliance results (PENDING, COMPLIANT, PARTIALLY_COMPLIANT, NON_COMPLIANT, NOT_APPLICABLE)',
    )
    .addTag(
      'Gap Analysis',
      'Read-only compliance gap summary derived from matrix rows (no separate store)',
    )
    .addTag(
      'Evidence',
      'Document references and metadata linked to matrix requirements (no file storage)',
    )
    .addTag(
      'Reviews',
      'SME assessment reviews (APPROVED, REJECTED, NEEDS_CHANGES) — not a workflow engine',
    )
    .addTag(
      'Sign-offs',
      'Final compliance sign-off per assessment (SIGNED_OFF, REJECTED)',
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3008;
  await app.listen(port);
}

void bootstrap();