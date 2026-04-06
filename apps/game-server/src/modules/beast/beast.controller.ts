import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import {
  parseBeastGrowthRequest,
  parseBeastDetailRequest,
  parseBeastListRequest,
  parseDefaultTeamSetupRequest,
} from '@workspace/schemas';
import { BeastService } from './beast.service';

function resolveReadTraceId(
  requestId: string | undefined,
  seed: string | undefined,
): string {
  if (requestId?.trim()) {
    return requestId.trim();
  }

  if (seed?.trim()) {
    return `beast-${createHash('sha256')
      .update(seed.trim())
      .digest('hex')
      .slice(0, 16)}`;
  }

  return randomUUID();
}

@Controller('beast')
export class BeastController {
  constructor(private readonly beastService: BeastService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getBeastList(
    @Headers('x-session-token') sessionToken?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    const traceId = resolveReadTraceId(requestId, sessionToken);

    try {
      const request = parseBeastListRequest({
        sessionToken,
      });
      const response = this.beastService.getBeastList(
        request.sessionToken,
        traceId,
      );

      if (!response.ok) {
        if (response.error.code === 'BEAST_LIST_STATE_MISSING') {
          throw new NotFoundException(response);
        }

        throw new UnauthorizedException(response);
      }

      return response;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          ok: false,
          traceId,
          error: {
            code: 'BEAST_LIST_INVALID_INPUT',
            message: '幻兽列表请求无效',
            retryable: false,
          },
        });
      }

      throw error;
    }
  }

  @Get(':beastInstanceId')
  @HttpCode(HttpStatus.OK)
  getBeastDetail(
    @Param('beastInstanceId') beastInstanceId?: string,
    @Headers('x-session-token') sessionToken?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    const traceId = resolveReadTraceId(
      requestId,
      sessionToken && beastInstanceId
        ? `${sessionToken}:${beastInstanceId}`
        : sessionToken,
    );

    try {
      const request = parseBeastDetailRequest({
        sessionToken,
        beastInstanceId,
      });
      const response = this.beastService.getBeastDetail(
        request.sessionToken,
        request.beastInstanceId,
        traceId,
      );

      if (!response.ok) {
        if (
          response.error.code === 'BEAST_DETAIL_STATE_MISSING' ||
          response.error.code === 'BEAST_DETAIL_NOT_FOUND'
        ) {
          throw new NotFoundException(response);
        }

        throw new UnauthorizedException(response);
      }

      return response;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          ok: false,
          traceId,
          error: {
            code: 'BEAST_DETAIL_INVALID_INPUT',
            message: '幻兽详情请求无效',
            retryable: false,
          },
        });
      }

      throw error;
    }
  }

  @Post('team/default')
  @HttpCode(HttpStatus.OK)
  setupDefaultTeam(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
  ) {
    const traceId = requestId?.trim() || randomUUID();

    try {
      const request = parseDefaultTeamSetupRequest(body);
      const response = this.beastService.setupDefaultTeam(
        request.sessionToken,
        request.beastInstanceIds,
        traceId,
      );

      if (!response.ok) {
        if (response.error.code === 'DEFAULT_TEAM_SETUP_STATE_MISSING') {
          throw new NotFoundException(response);
        }

        if (
          response.error.code === 'DEFAULT_TEAM_SETUP_BEAST_NOT_FOUND' ||
          response.error.code === 'DEFAULT_TEAM_SETUP_TEAM_CAPACITY_EXCEEDED' ||
          response.error.code === 'DEFAULT_TEAM_SETUP_DUPLICATE_BEAST'
        ) {
          throw new ConflictException(response);
        }

        throw new UnauthorizedException(response);
      }

      return response;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          ok: false,
          traceId,
          error: {
            code: 'DEFAULT_TEAM_SETUP_INVALID_INPUT',
            message: '默认队伍配置请求无效',
            retryable: false,
          },
        });
      }

      throw error;
    }
  }

  @Post('growth')
  @HttpCode(HttpStatus.OK)
  growBeast(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
  ) {
    const traceId = requestId?.trim() || randomUUID();

    try {
      const request = parseBeastGrowthRequest(body);
      const response = this.beastService.growBeast(
        request.sessionToken,
        request.beastInstanceId,
        request.actionId,
        traceId,
      );

      if (!response.ok) {
        if (response.error.code === 'BEAST_GROWTH_STATE_MISSING') {
          throw new NotFoundException(response);
        }

        if (response.error.code === 'BEAST_GROWTH_BEAST_NOT_FOUND') {
          throw new NotFoundException(response);
        }

        if (
          response.error.code === 'BEAST_GROWTH_RESOURCE_INSUFFICIENT' ||
          response.error.code === 'BEAST_GROWTH_ACTION_NOT_ALLOWED'
        ) {
          throw new ConflictException(response);
        }

        throw new UnauthorizedException(response);
      }

      return response;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          ok: false,
          traceId,
          error: {
            code: 'BEAST_GROWTH_INVALID_INPUT',
            message: '幻兽培养请求无效',
            retryable: false,
          },
        });
      }

      throw error;
    }
  }
}
