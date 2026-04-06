import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { parseSessionAuthRequest } from '@workspace/schemas';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('auth')
  @HttpCode(HttpStatus.OK)
  authenticate(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
  ) {
    const traceId = requestId?.trim() || crypto.randomUUID();

    try {
      const request = parseSessionAuthRequest(body);
      return this.sessionService.authenticate(request, traceId);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          ok: false,
          traceId,
          error: {
            code: 'SESSION_AUTH_INVALID_INPUT',
            message: '统一会话请求无效',
            retryable: false,
          },
        });
      }

      throw error;
    }
  }
}
