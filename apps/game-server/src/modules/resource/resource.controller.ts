import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ZodError } from 'zod';
import {
  parseResourceConsumeRequest,
  parseRewardClaimRequest,
} from '@workspace/schemas';
import { ResourceService } from './resource.service';

@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post('rewards/claim')
  @HttpCode(HttpStatus.OK)
  claimReward(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
  ) {
    const traceId = requestId?.trim() || crypto.randomUUID();

    try {
      const request = parseRewardClaimRequest(body);
      const response = this.resourceService.claimReward(
        request.sessionToken,
        request.rewardBundleId,
        traceId,
      );

      if (!response.ok) {
        if (response.error.code === 'REWARD_CLAIM_CAPACITY_BLOCKED') {
          throw new ConflictException(response);
        }

        if (response.error.code === 'REWARD_CLAIM_STATE_MISSING') {
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
            code: 'REWARD_CLAIM_INVALID_INPUT',
            message: '奖励领取请求无效',
            retryable: false,
          },
        });
      }

      throw error;
    }
  }

  @Post('consume')
  @HttpCode(HttpStatus.OK)
  consumeResource(
    @Body() body: unknown,
    @Headers('x-request-id') requestId?: string,
  ) {
    const traceId = requestId?.trim() || crypto.randomUUID();

    try {
      const request = parseResourceConsumeRequest(body);
      const response = this.resourceService.consumeResource(
        request.sessionToken,
        request.actionId,
        traceId,
      );

      if (!response.ok) {
        if (
          response.error.code === 'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT' ||
          response.error.code === 'RESOURCE_CONSUME_ITEM_INSUFFICIENT' ||
          response.error.code === 'RESOURCE_CONSUME_ACTION_NOT_ALLOWED'
        ) {
          throw new ConflictException(response);
        }

        if (response.error.code === 'RESOURCE_CONSUME_STATE_MISSING') {
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
            code: 'RESOURCE_CONSUME_INVALID_INPUT',
            message: '资源消耗请求无效',
            retryable: false,
          },
        });
      }

      throw error;
    }
  }
}
