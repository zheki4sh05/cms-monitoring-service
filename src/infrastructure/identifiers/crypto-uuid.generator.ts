import { Injectable } from '@nestjs/common';
import type { UuidGenerator } from '../../core/shared/ports/uuid-generator.port.js';

@Injectable()
export class CryptoUuidGenerator implements UuidGenerator {
  generate(): string {
    return `ro-${Date.now()}`;
  }
}
