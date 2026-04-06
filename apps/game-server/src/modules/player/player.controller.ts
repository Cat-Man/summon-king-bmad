import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { parsePlayerInitRequest } from '@workspace/schemas';
import { PlayerService } from './player.service';

@Controller('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post('init')
  @HttpCode(HttpStatus.OK)
  initializePlayer(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
  ) {
    const traceId = requestId?.trim() || crypto.randomUUID();

    try {
      const request = parsePlayerInitRequest(body);
      const response = this.playerService.initializePlayer(request, traceId);

      if (!response.ok) {
        throw new UnauthorizedException(response);
      }

      return response;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          ok: false,
          traceId,
          error: {
            code: 'PLAYER_INIT_INVALID_INPUT',
            message: '初始化请求无效',
            retryable: false,
          },
        });
      }

      throw error;
    }
  }
}
