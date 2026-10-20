import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { json } from 'express';
import { CspController } from './csp.controller';

@Module({
  controllers: [CspController],
})
export class CspModule implements NestModule {
  // Nest's default parser only reads application/json; reports come as csp-report / reports+json.
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(json({ type: ['application/csp-report', 'application/reports+json'] }))
      .forRoutes(CspController);
  }
}
