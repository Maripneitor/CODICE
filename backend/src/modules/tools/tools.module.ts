import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { LoansController } from './loans.controller';
import { Tool } from './entities/tool.entity';
import { ToolStatus } from './entities/tool-status.entity';
import { ToolType } from './entities/tool-type.entity';
import { Category } from './entities/category.entity';
import { Loan } from './entities/loan.entity';
import { LoanDetail } from './entities/loan-detail.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tool, ToolStatus, ToolType, Category, Loan, LoanDetail]),
    AuthModule,
  ],
  controllers: [ToolsController, LoansController],
  providers: [ToolsService],
  exports: [ToolsService],
})
export class ToolsModule {}
