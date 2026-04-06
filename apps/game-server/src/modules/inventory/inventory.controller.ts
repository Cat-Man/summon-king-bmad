import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { parseInventorySnapshotRequest } from '@workspace/schemas';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getInventorySnapshot(
    @Headers('x-session-token') sessionToken?: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    const traceId = requestId?.trim() || crypto.randomUUID();

    try {
      const request = parseInventorySnapshotRequest({
        sessionToken,
      });
      const response = this.inventoryService.getInventorySnapshot(
        request.sessionToken,
        traceId,
      );

      if (!response.ok) {
        if (response.error.code === 'INVENTORY_STATE_MISSING') {
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
            code: 'INVENTORY_INVALID_INPUT',
            message: '库存请求无效',
            retryable: false,
          },
        });
      }

      throw error;
    }
  }
}
