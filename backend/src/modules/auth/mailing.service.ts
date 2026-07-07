import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailingService {
  private readonly logger = new Logger(MailingService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.MAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.MAIL_PORT) || 587;
    const user = process.env.MAIL_USER || 'mariopneitor@gmail.com';
    const pass = process.env.Gmail_pasword || process.env.MAIL_PASSWORD;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: pass ? {
        user,
        pass,
      } : undefined,
    });
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const escapedEmail = this.escapeHtml(email);
    const escapedToken = this.escapeHtml(token);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${escapedToken}`;
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 8px;">
        <h2 style="color: #ca8a04; font-family: serif;">CÓDICE - Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña de acceso al sistema Códice.</p>
        <p>Por favor, haz clic en el siguiente enlace para continuar. Este enlace expira en 15 minutos por motivos de seguridad:</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #ca8a04; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px;">Restablecer Contraseña</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
      </div>
    `;

    // Emit and log formatted template to console for development verification
    this.logger.log(`
[MAILING SERVICE] Enlace de recuperación despachado a ${escapedEmail}:
--------------------------------------------------
Token: ${escapedToken}
URL: ${resetUrl}
--------------------------------------------------
    `);

    try {
      const pass = process.env.Gmail_pasword || process.env.MAIL_PASSWORD;
      if (pass) {
        await this.transporter.sendMail({
          from: `"CÓDICE" <${process.env.MAIL_USER || 'mariopneitor@gmail.com'}>`,
          to: email,
          subject: 'CÓDICE - Recuperación de Contraseña',
          html: htmlContent,
        });
        this.logger.log(`Correo de recuperación enviado exitosamente a ${escapedEmail}`);
      }
    } catch (error) {
      this.logger.error(`Error al enviar correo de recuperación a ${escapedEmail}:`, error);
    }
  }

  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    const escapedEmail = this.escapeHtml(email);
    const escapedOtp = this.escapeHtml(otpCode);
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 8px;">
        <h2 style="color: #ca8a04; font-family: serif;">CÓDICE - Código de Verificación OTP</h2>
        <p>Para completar tu autenticación de seguridad en la aplicación móvil de campo, introduce el siguiente código OTP:</p>
        <div style="margin: 24px 0; background-color: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #cbd5e1;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a; font-family: monospace;">${escapedOtp}</span>
        </div>
        <p style="font-size: 12px; color: #64748b;">Este código expira en 15 minutos. No lo compartas con nadie.</p>
      </div>
    `;

    this.logger.log(`
[MAILING SERVICE] Código OTP despachado a ${escapedEmail}:
--------------------------------------------------
Código: ${escapedOtp}
--------------------------------------------------
    `);

    try {
      const pass = process.env.Gmail_pasword || process.env.MAIL_PASSWORD;
      if (pass) {
        await this.transporter.sendMail({
          from: `"CÓDICE" <${process.env.MAIL_USER || 'mariopneitor@gmail.com'}>`,
          to: email,
          subject: 'CÓDICE - Código de Verificación OTP',
          html: htmlContent,
        });
        this.logger.log(`Correo OTP enviado exitosamente a ${escapedEmail}`);
      }
    } catch (error) {
      this.logger.error(`Error al enviar correo OTP a ${escapedEmail}:`, error);
    }
  }
}
