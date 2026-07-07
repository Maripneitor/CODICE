import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateArtifactDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'La ubicación debe ser una cadena de texto.' })
  location?: string;

  @IsOptional()
  @IsString({ message: 'El estado debe ser una cadena de texto.' })
  @IsIn(['Catálogo Activo', 'En Restauración', 'Extraviado/Dañado'], {
    message: 'El estado proporcionado no es válido.',
  })
  status?: string;
}
