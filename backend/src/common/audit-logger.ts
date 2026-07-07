import * as winston from 'winston';
import * as path from 'path';

const logDir = path.join(process.cwd(), 'logs');

export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: path.join(logDir, 'audit.log'), level: 'info' }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  ],
});
