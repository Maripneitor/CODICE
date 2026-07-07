import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailingService } from './mailing.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly mailingService: MailingService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password } = registerDto;
    
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }

    // Hash password with salt cost of 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Assign default role 'AUDITOR'
    let defaultRole = await this.roleRepository.findOne({ where: { name: 'AUDITOR' } });
    if (!defaultRole) {
      // Fallback if roles table is not populated yet
      defaultRole = this.roleRepository.create({ name: 'AUDITOR' });
      await this.roleRepository.save(defaultRole);
    }

    const user = this.userRepository.create({
      email,
      passwordHash,
      role: defaultRole,
      status: 'ACTIVE',
    });

    await this.userRepository.save(user);

    return { message: 'Usuario registrado exitosamente.' };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string; email: string }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ 
      where: { email },
      select: { id: true, email: true, passwordHash: true, status: true },
      relations: { role: true }
    });

    if (!user) {
      throw new UnauthorizedException('Correo institucional o contraseña incorrectos.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Su cuenta no se encuentra activa.');
    }

    let isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Fallback: try comparing lowercase password for user convenience
      isPasswordValid = await bcrypt.compare(password.toLowerCase(), user.passwordHash);
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Correo institucional o contraseña incorrectos.');
    }

    // Generate JWT tokens
    const payload = { sub: user.id, email: user.email, role: user.role?.name || 'AUDITOR' };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Hash and store refresh token
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.userRepository.save(user);

    return { accessToken, refreshToken, email: user.email };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string; resetToken?: string }> {
    const { email } = forgotPasswordDto;
    
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return { message: 'Si el correo electrónico está registrado, se enviará un enlace de recuperación.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    await this.userRepository.save(user);

    // Call the mailer service
    await this.mailingService.sendResetPasswordEmail(user.email, resetToken);

    return { 
      message: 'Si el correo electrónico está registrado, se enviará un enlace de recuperación.',
      resetToken 
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
      select: { id: true, email: true, resetPasswordToken: true, resetPasswordExpires: true, passwordHash: true }
    });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now()) {
      throw new BadRequestException('El token de recuperación es inválido o ha expirado.');
    }

    // Hash the new password with salt cost of 12
    const passwordHash = await bcrypt.hash(password, 12);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);

    return { message: 'Contraseña restablecida exitosamente.' };
  }

  async requestOtp(email: string): Promise<{ message: string; otpCode?: string }> {
    const user = await this.userRepository.findOne({ 
      where: { email },
      select: { id: true, email: true, status: true, otpCode: true, otpExpires: true }
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new BadRequestException('Correo institucional o contraseña incorrectos.');
    }

    // Generate cryptographically secure random 6-digit code using native crypto.randomInt
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    user.otpCode = otpCode;
    const otpExpiresIn = Number(process.env.AUTH_OTP_EXPIRES_IN) || 900;
    user.otpExpires = new Date(Date.now() + otpExpiresIn * 1000); // 15 minutes expiration by default

    await this.userRepository.save(user);

    // Send OTP email via mailing service
    await this.mailingService.sendOtpEmail(user.email, otpCode);

    return { message: 'Código OTP enviado exitosamente.', otpCode };
  }

  async verifyOtp(email: string, code: string): Promise<{ accessToken: string; refreshToken: string; email: string }> {
    const user = await this.userRepository.findOne({ 
      where: { email },
      select: { id: true, email: true, status: true, otpCode: true, otpExpires: true },
      relations: { role: true }
    });
    if (!user || !user.otpCode || user.otpCode !== code) {
      throw new UnauthorizedException('Código OTP inválido o vencido.');
    }

    if (!user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      throw new UnauthorizedException('Código OTP inválido o vencido.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Su cuenta no se encuentra activa.');
    }

    // Reset OTP fields
    user.otpCode = null;
    user.otpExpires = null;

    // Generate JWT tokens
    const payload = { sub: user.id, email: user.email, role: user.role?.name || 'AUDITOR' };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.userRepository.save(user);

    return { accessToken, refreshToken, email: user.email };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({ 
        where: { id: payload.sub },
        select: { id: true, email: true, status: true, refreshTokenHash: true },
        relations: { role: true }
      });
      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Token de actualización inválido o revocado.');
      }
      
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Su cuenta no se encuentra activa.');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isMatch) {
        throw new UnauthorizedException('Token de actualización inválido.');
      }
      
      // Generate new tokens (rotation)
      const newPayload = { sub: user.id, email: user.email, role: user.role?.name || 'AUDITOR' };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });
      
      user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
      await this.userRepository.save(user);
      
      return { accessToken, refreshToken: newRefreshToken };
    } catch (e) {
      throw new UnauthorizedException('Token de actualización inválido o expirado.');
    }
  }

  async revokeAll(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      select: { id: true, refreshTokenHash: true }
    });
    if (user) {
      user.refreshTokenHash = null;
      await this.userRepository.save(user);
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }
}
