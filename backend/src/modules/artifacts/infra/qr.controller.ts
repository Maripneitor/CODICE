import { Controller, Get, Param, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import * as express from 'express';
import { QrService } from '../application/qr.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/guards/roles.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('artifacts')
@UseGuards(RolesGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get(':id/qr')
  @Roles('admin', 'restorer', 'viewer')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Max 10 requests per minute
  @HttpCode(HttpStatus.OK)
  async getQrCode(@Param('id') id: string, @Res() res: express.Response) {
    const svgString = await this.qrService.generateQrSvg(id);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgString);
  }
}
