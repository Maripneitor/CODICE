import { Controller, Post, Get, Body, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { SyncService, SyncPushPayload } from './sync.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';

export interface RequestWithUser extends Request {
  user?: {
    email: string;
    role: string;
  };
}

@Controller('sync')
@UseGuards(RolesGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @Roles('admin', 'restorer')
  @HttpCode(HttpStatus.OK)
  async push(@Body() body: SyncPushPayload, @Req() req: RequestWithUser) {
    const responsible = req.user?.email || 'Sincronizador Móvil';
    return this.syncService.push(body, responsible);
  }

  @Get('pull')
  @Roles('admin', 'restorer', 'viewer')
  @HttpCode(HttpStatus.OK)
  async pull(@Query('lastPulledAt') lastPulledAt?: string) {
    const lastPulledTimestamp = lastPulledAt ? Number(lastPulledAt) : undefined;
    return this.syncService.pull(lastPulledTimestamp);
  }
}
