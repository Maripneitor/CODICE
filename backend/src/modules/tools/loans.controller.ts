import { Controller, Get, Post, Param, Body, Query, UseGuards, Req, HttpCode, HttpStatus, Response } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateLoanDto, ReturnLoanDto, ReportQueryDto } from './dto/loans.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import * as express from 'express';

@Controller('tools/loans')
@UseGuards(RolesGuard)
export class LoansController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  @Roles('WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async createLoan(@Body() createLoanDto: CreateLoanDto, @Req() req: any) {
    const deliveringUserId = req.user.sub;
    const requestIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const requestDevice = req.headers['user-agent'] || 'Unknown Device';
    const loan = await this.toolsService.createLoan(createLoanDto, deliveringUserId, requestIp, requestDevice);
    return { success: true, loan };
  }

  @Post(':id/return')
  @Roles('WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.OK)
  async returnLoan(@Param('id') id: string, @Body() returnLoanDto: ReturnLoanDto) {
    const loan = await this.toolsService.returnLoan(id, returnLoanDto);
    return { success: true, loan };
  }

  @Get('reports')
  @Roles('AUDITOR')
  @HttpCode(HttpStatus.OK)
  async generateReport(@Query() queryDto: ReportQueryDto) {
    if (queryDto.limit) queryDto.limit = Number(queryDto.limit);
    const report = await this.toolsService.generateReport(queryDto);
    return { success: true, report };
  }

  @Get('reports/csv')
  @Roles('AUDITOR')
  async exportCsv(@Query() queryDto: ReportQueryDto, @Response() res: express.Response) {
    if (queryDto.limit) queryDto.limit = Number(queryDto.limit);
    const csv = await this.toolsService.exportCsv(queryDto);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-prestamos.csv');
    return res.status(200).send(csv);
  }
}
