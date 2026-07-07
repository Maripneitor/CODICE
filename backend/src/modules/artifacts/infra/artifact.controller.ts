import { Controller, Post, Patch, Get, Delete, Body, Param, Query, Req, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: {
    email: string;
    role: string;
  };
}
import { ArtifactsService } from '../application/artifacts.service';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { UpdateArtifactDto } from './dto/update-artifact.dto';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/guards/roles.decorator';

@Controller('artifacts')
@UseGuards(RolesGuard)
export class ArtifactController {
  constructor(private readonly artifactsService: ArtifactsService) {}

  @Post()
  @Roles('admin', 'restorer')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createArtifactDto: CreateArtifactDto,
    @Req() req: RequestWithUser,
  ) {
    const responsible = req.user?.email || 'Desconocido';
    const origin = (req.headers['x-client-origin'] as string) || 'Panel Web';
    return this.artifactsService.create(createArtifactDto, responsible, origin);
  }

  @Get()
  @Roles('admin', 'restorer', 'viewer')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('material') material?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.artifactsService.findAll({
      page,
      limit,
      search,
      status,
      material,
      sortBy,
      sortOrder,
    });
  }

  // --- REPORT ENDPOINTS (MUST be before :id to avoid route capture) ---

  @Get('reports/data')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async getReportsData() {
    return this.artifactsService.getReportsData();
  }

  @Get('reports/download-pdf')
  @Roles('admin')
  async downloadPdf(
    @Query('type') type: string,
    @Req() req: RequestWithUser,
    @Res() res: any,
  ) {
    const responsible = req.user?.email || 'Administrador';
    return this.artifactsService.generatePdfReport(type || 'stock', responsible, res);
  }

  // --- END REPORT ENDPOINTS ---

  @Get(':id')
  @Roles('admin', 'restorer', 'viewer')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.artifactsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'restorer')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateArtifactDto: UpdateArtifactDto,
    @Req() req: RequestWithUser,
  ) {
    const responsible = req.user?.email || 'Desconocido';
    const origin = (req.headers['x-client-origin'] as string) || 'Panel Web';
    return this.artifactsService.update(id, updateArtifactDto, responsible, origin);
  }

  @Delete(':id')
  @Roles('admin', 'restorer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const responsible = req.user?.email || 'Desconocido';
    return this.artifactsService.delete(id, responsible);
  }

  @Post('loan')
  @Roles('admin', 'restorer')
  @HttpCode(HttpStatus.OK)
  async loan(
    @Body() body: { ids: string[]; tecnicoEmail: string; signature: string },
    @Req() req: RequestWithUser,
  ) {
    const responsible = req.user?.email || 'Desconocido';
    return this.artifactsService.loanArtifacts(body.ids, body.tecnicoEmail, responsible, body.signature);
  }

  @Post('return')
  @Roles('admin', 'restorer')
  @HttpCode(HttpStatus.OK)
  async return(
    @Body() body: { id: string; statusCheck: 'Excelente' | 'Desgastado' | 'Dañado / Requiere Mantenimiento'; details: string },
    @Req() req: RequestWithUser,
  ) {
    const responsible = req.user?.email || 'Desconocido';
    return this.artifactsService.returnArtifact(body.id, body.statusCheck, body.details, responsible);
  }
}
