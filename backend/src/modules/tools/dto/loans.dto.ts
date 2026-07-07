import { IsString, IsNotEmpty, IsArray, IsUUID, IsOptional, IsDateString, IsIn, IsInt, Min, Max } from 'class-validator';

export class CreateLoanDto {
  @IsArray()
  @IsUUID('all', { each: true })
  toolIds: string[];

  @IsUUID()
  @IsNotEmpty()
  requestingUserId: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  applicantNotes?: string;

  @IsString()
  @IsOptional()
  signature?: string;
}

export class ReturnLoanDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['BUENO', 'DAÑADO', 'INCOMPLETO'])
  returnCondition: 'BUENO' | 'DAÑADO' | 'INCOMPLETO';

  @IsString()
  @IsNotEmpty()
  signature: string;
}

export class ReportQueryDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10000)
  limit?: number;
}
