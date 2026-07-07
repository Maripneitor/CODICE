import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

export class EncryptionTransformer implements ValueTransformer {
  private readonly algorithm = 'aes-256-cbc';
  private get key(): Buffer {
    const rawKey = process.env.CRYPTO_KEY || 'default-fallback-key-for-development-32-chars';
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  private get iv(): Buffer {
    // Generate a deterministic IV from the key to keep encryption deterministic and queryable
    return crypto.createHash('sha256').update(this.key).digest().slice(0, 16);
  }

  to(value: string | null | undefined): string | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  from(value: string | null | undefined): string | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    try {
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
      let decrypted = decipher.update(value, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      // In case decryption fails (e.g. if the existing database field is in plaintext), return original value
      return value;
    }
  }
}
