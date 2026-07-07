import { IsString, IsNotEmpty, IsOptional, IsUrl, IsInt, IsIn, Min, Max } from 'class-validator';

export class CreateToolDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'imageUrl debe ser una URL válida' })
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsInt()
  @IsNotEmpty()
  typeId: number;

  @IsInt()
  @IsOptional()
  statusId?: number;
}

export class UpdateToolDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'imageUrl debe ser una URL válida' })
  imageUrl?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @IsOptional()
  typeId?: number;

  @IsInt()
  @IsOptional()
  statusId?: number;

  @IsInt()
  @IsOptional()
  version?: number;
}

export class ChangeStatusDto {
  @IsInt()
  @IsNotEmpty()
  statusId: number;

  @IsInt()
  @IsNotEmpty()
  version: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class SearchToolsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(1000)
  limit?: number;
}
