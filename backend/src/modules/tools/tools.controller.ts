import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto, UpdateToolDto, ChangeStatusDto, SearchToolsDto } from './dto/tools.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';

@Controller('tools')
@UseGuards(RolesGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post()
  @Roles('WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createToolDto: CreateToolDto) {
    const tool = await this.toolsService.create(createToolDto);
    return { success: true, code: tool.code, tool };
  }

  @Get()
  @Roles('AUDITOR')
  @HttpCode(HttpStatus.OK)
  async search(@Query() searchDto: SearchToolsDto) {
    // Transform pagination values if they are strings
    if (searchDto.page) searchDto.page = Number(searchDto.page);
    if (searchDto.limit) searchDto.limit = Number(searchDto.limit);
    const result = await this.toolsService.search(searchDto);
    return { success: true, ...result };
  }

  @Get(':id')
  @Roles('AUDITOR')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const tool = await this.toolsService.findOne(id);
    return { success: true, tool };
  }

  @Patch(':id')
  @Roles('SUPERVISOR')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    const tool = await this.toolsService.update(id, updateToolDto);
    return { success: true, tool };
  }

  @Patch(':id/status')
  @Roles('TECHNICIAN')
  @HttpCode(HttpStatus.OK)
  async changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @Req() req: any
  ) {
    const userRole = req.user?.role || 'AUDITOR';
    const tool = await this.toolsService.changeStatus(id, changeStatusDto, userRole);
    return { success: true, tool };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.toolsService.remove(id);
    return { success: true, message: 'Herramienta eliminada correctamente.' };
  }

  // --- Category Endpoints ---

  @Post('categories')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body('name') name: string) {
    const category = await this.toolsService.createCategory(name);
    return { success: true, category };
  }

  @Delete('categories/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async removeCategory(@Param('id') id: number) {
    await this.toolsService.removeCategory(Number(id));
    return { success: true, message: 'Categoría eliminada correctamente.' };
  }

  // --- ToolType Endpoints ---

  @Post('types')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createToolType(@Body('name') name: string, @Body('categoryIds') categoryIds: number[]) {
    const toolType = await this.toolsService.createToolType(name, categoryIds || []);
    return { success: true, toolType };
  }

  @Delete('types/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async removeToolType(@Param('id') id: number) {
    await this.toolsService.removeToolType(Number(id));
    return { success: true, message: 'Tipo de herramienta eliminado correctamente.' };
  }
}
