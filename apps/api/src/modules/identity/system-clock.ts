import { Injectable } from '@nestjs/common';
import type { Clock } from './identity.types';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
