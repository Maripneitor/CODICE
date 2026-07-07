import { Controller, Post, Body, Res, HttpCode, HttpStatus, Get, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import * as express from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RedisService } from '../../common/services/redis.service';
import { JwtService } from '@nestjs/jwt';
import { auditLogger } from '../../common/audit-logger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  @Throttle({ auth: { limit: 5, ttl: 900000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ auth: { limit: 5, ttl: 900000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || request.ip;
    const userAgent = request.headers['user-agent'] || 'unknown';

    try {
      const result = await this.authService.login(loginDto);
      
      // Inject cookies with secure flags (signed: true, partitioned: true)
      response.cookie('auth_token', result.accessToken, {
        httpOnly: true,
        secure: true, 
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
        signed: true,
        partitioned: true,
      });

      response.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000, // 7 days
        path: '/',
        signed: true,
        partitioned: true,
      });

      return { 
        message: 'Inicio de sesión exitoso.',
        email: result.email,
        token: result.accessToken,
        refreshToken: result.refreshToken
      };
    } catch (error) {
      // Log failed login attempts with IP, attempted username, and user-agent
      auditLogger.warn({
        message: `Intento de inicio de sesión fallido`,
        ip,
        username: loginDto.email,
        userAgent,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body('email') email: string) {
    return this.authService.requestOtp(email);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body('email') email: string,
    @Body('code') code: string,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.verifyOtp(email, code);
    
    response.cookie('auth_token', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      signed: true,
      partitioned: true,
    });

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 3600 * 1000, // 7 days
      path: '/',
      signed: true,
      partitioned: true,
    });

    return { 
      message: 'Inicio de sesión por OTP exitoso.', 
      token: result.accessToken, 
      refreshToken: result.refreshToken,
      email: result.email 
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const refreshToken = request.signedCookies?.['refresh_token'] || request.cookies?.['refresh_token'] || request.headers['x-refresh-token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Token de actualización no proporcionado.');
    }
    
    const result = await this.authService.refresh(refreshToken);
    
    response.cookie('auth_token', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
      signed: true,
      partitioned: true,
    });

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 3600 * 1000,
      path: '/',
      signed: true,
      partitioned: true,
    });

    return {
      message: 'Tokens actualizados exitosamente.',
      token: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const token = request.signedCookies?.['auth_token'] || request.cookies?.['auth_token'] || request.headers['authorization']?.split(' ')[1];
    if (token) {
      try {
        const payload = this.jwtService.decode(token) as any;
        if (payload && payload.exp) {
          const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
          if (ttl > 0) {
            const tokenParts = token.split('.');
            const tokenSignature = tokenParts[2] || token;
            await this.redisService.addToBlacklist(tokenSignature, ttl);
          }
        }
      } catch (err) {
        // Ignore JWT decode error on logout
      }
    }

    response.clearCookie('auth_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      partitioned: true,
    });
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      partitioned: true,
    });
    return { message: 'Sesión cerrada exitosamente.' };
  }

  @Get('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Req() request: express.Request) {
    const token = request.signedCookies?.['auth_token'] || request.cookies?.['auth_token'] || request.headers['authorization']?.split(' ')[1];
    if (!token) {
      return { authenticated: false };
    }
    try {
      const payload = await this.authService.validateToken(token);
      return { authenticated: true, user: payload };
    } catch (e) {
      return { authenticated: false };
    }
  }
}
