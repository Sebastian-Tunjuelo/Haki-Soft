import { Injectable } from '@nestjs/common';
import type { BuyerDeliveryNotice } from '@taskstream/shared-schemas';

type Listener = (notice: BuyerDeliveryNotice) => void;

@Injectable()
export class BuyerNotificationHub {
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly pending = new Map<string, BuyerDeliveryNotice[]>();

  subscribe(buyerUserId: string, listener: Listener): () => void {
    let set = this.listeners.get(buyerUserId);
    if (!set) {
      set = new Set();
      this.listeners.set(buyerUserId, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
      if (set!.size === 0) this.listeners.delete(buyerUserId);
    };
  }

  publish(buyerUserId: string, notice: BuyerDeliveryNotice): void {
    const list = this.pending.get(buyerUserId) ?? [];
    list.unshift(notice);
    this.pending.set(buyerUserId, list.slice(0, 20));
    const set = this.listeners.get(buyerUserId);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(notice);
      } catch {
        /* aislado */
      }
    }
  }

  listPending(buyerUserId: string): BuyerDeliveryNotice[] {
    return [...(this.pending.get(buyerUserId) ?? [])];
  }

  clear(buyerUserId: string, taskId?: string): void {
    if (!taskId) {
      this.pending.delete(buyerUserId);
      return;
    }
    const next = (this.pending.get(buyerUserId) ?? []).filter((n) => n.taskId !== taskId);
    this.pending.set(buyerUserId, next);
  }
}
