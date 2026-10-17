import { Injectable } from '@nestjs/common';
import type { SellerAcceptanceNotice } from '@taskstream/shared-schemas';

@Injectable()
export class SellerAcceptanceHub {
  private readonly pending = new Map<string, SellerAcceptanceNotice[]>();

  publish(sellerUserId: string, notice: SellerAcceptanceNotice): void {
    const list = this.pending.get(sellerUserId) ?? [];
    list.unshift(notice);
    this.pending.set(sellerUserId, list.slice(0, 20));
  }

  listPending(sellerUserId: string): SellerAcceptanceNotice[] {
    return [...(this.pending.get(sellerUserId) ?? [])];
  }

  clear(sellerUserId: string, taskId?: string): void {
    if (!taskId) {
      this.pending.delete(sellerUserId);
      return;
    }
    const next = (this.pending.get(sellerUserId) ?? []).filter((n) => n.taskId !== taskId);
    this.pending.set(sellerUserId, next);
  }
}
