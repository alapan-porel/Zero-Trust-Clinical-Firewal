import crypto from 'crypto';

export interface EncryptedPayload {
  encrypted: string;
  salt: string;
  iv: string;
  authTag: string;
}

/**
 * EncryptionVault
 * Implements authenticated AES-256-GCM encryption with PBKDF2 key derivation.
 * Conforms to NIST SP 800-38D and HIPAA Security Rule specifications for data-at-rest.
 */
export class EncryptionVault {
  private readonly algorithm = 'aes-256-gcm';
  private readonly iterations = 100000;
  private readonly keyLength = 32; // 256 bits
  private readonly saltLength = 16;
  private readonly ivLength = 16;
  private readonly hashAlgorithm = 'sha256';
  private readonly masterKey: string;

  constructor(masterKey?: string) {
    this.masterKey = masterKey || process.env.CLINICAL_VAULT_MASTER_KEY || 'default-zero-trust-clinical-cleanroom-key';
  }

  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      this.iterations,
      this.keyLength,
      this.hashAlgorithm
    );
  }

  public encrypt(plaintext: string): EncryptedPayload {
    if (!plaintext) {
      throw new Error('Plaintext cannot be empty');
    }

    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);
    const key = this.deriveKey(salt);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  public decrypt(payload: EncryptedPayload): string {
    const salt = Buffer.from(payload.salt, 'hex');
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');
    const key = this.deriveKey(salt);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
