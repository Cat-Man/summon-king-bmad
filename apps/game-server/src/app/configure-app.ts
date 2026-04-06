import type { INestApplication } from '@nestjs/common';

export const apiGlobalPrefix = 'api/v1';

export function configureGameServerApp(app: INestApplication): void {
  app.setGlobalPrefix(apiGlobalPrefix);
}
