import type { INestApplication } from '@nestjs/common';
import { apiGlobalPrefix, configureGameServerApp } from './configure-app';

describe('configureGameServerApp', () => {
  it('uses the formal /api/v1 prefix for player-facing endpoints', () => {
    const app = {
      setGlobalPrefix: jest.fn(),
    } as unknown as INestApplication;

    configureGameServerApp(app);

    expect(apiGlobalPrefix).toBe('api/v1');
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
  });
});
