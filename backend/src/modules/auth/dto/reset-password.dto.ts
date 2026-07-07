import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'El token de restablecimiento debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El token de restablecimiento es obligatorio.' })
  token: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).*$/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas, un número y un carácter especial.',
  })
  password: string;
}
