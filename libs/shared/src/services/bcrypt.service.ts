import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export abstract class HashPasswordService {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
}

@Injectable()
export class BcryptService implements HashPasswordService {
  async hash(rawPassword: string | Buffer): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(rawPassword, salt, 1000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }

  async compare(
    rawPassword: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    const [salt, storedHash] = encrypted.split(':');
    const suppliedHash = crypto
      .pbkdf2Sync(rawPassword, salt, 1000, 64, 'sha512')
      .toString('hex');
    return storedHash === suppliedHash;
  }
}
