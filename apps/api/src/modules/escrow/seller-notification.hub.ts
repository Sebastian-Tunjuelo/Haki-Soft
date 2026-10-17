import { Injectable } from '@nestjs/common';
import type { SellerActivityItem } from '@taskstream/shared-schemas';

type Listener = (item: SellerActivityItem) => void;

/**
 * Pub/sub en memoria para avisar al Freelancer en tiempo real (SSE)
 * cuando un Buyer solicita un Gig y espera confirmación.
 */
@Injectable()
export class SellerNotificationHub {
  private readonly listeners = new Map<string, Set<Listener>>();

  subscribe(sellerUserId: string, listener: Listener): () => void {
    let set = this.listeners.get(sellerUserId);
    if (!set) {
      set = new Set();
      this.listeners.set(sellerUserId, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
      if (set!.size === 0) this.listeners.delete(sellerUserId);
    };
  }

  publish(sellerUserId: string, item: SellerActivityItem): void {
    const set = this.listeners.get(sellerUserId);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(item);
      } catch {
        /* listener aislado */
      }
    }
  }
}
