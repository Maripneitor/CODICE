import { IsNotEmpty, IsString, IsOptional, Matches, IsIn } from 'class-validator';

export class CreateArtifactDto {
  @IsNotEmpty({ message: 'El código de artefacto es obligatorio.' })
  @IsString({ message: 'El código debe ser una cadena de texto.' })
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'El código solo puede contener letras, números y guiones.',
  })
  code: string;

  @IsNotEmpty({ message: 'El nombre del artefacto es obligatorio.' })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  name: string;

  @IsNotEmpty({ message: 'La descripción del artefacto es obligatoria.' })
  @IsString({ message: 'La descripción debe ser una cadena de texto.' })
  description: string;

  @IsNotEmpty({ message: 'La ubicación es obligatoria.' })
  @IsString({ message: 'La ubicación debe ser una cadena de texto.' })
  location: string;

  @IsOptional()
  @IsString({ message: 'El estado debe ser una cadena de texto.' })
  @IsIn(['Catálogo Activo', 'En Restauración', 'Extraviado/Dañado'], {
    message: 'El estado proporcionado no es válido.',
  })
  status?: string;

  @IsNotEmpty({ message: 'El material es obligatorio.' })
  @IsString({ message: 'El material debe ser una cadena de texto.' })
  material: string;

  @IsNotEmpty({ message: 'La época o periodo es obligatorio.' })
  @IsString({ message: 'La época debe ser una cadena de texto.' })
  epoch: string;

  @IsNotEmpty({ message: 'Las dimensiones son obligatorias.' })
  @IsString({ message: 'Las dimensiones deben ser una cadena de texto.' })
  dimensions: string;

  @IsNotEmpty({ message: 'El peso es obligatorio.' })
  @IsString({ message: 'El peso debe ser una cadena de texto.' })
  weight: string;

  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser una cadena de texto.' })
  imageUrl?: string;
}
