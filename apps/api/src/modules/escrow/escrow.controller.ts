import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  MessageEvent,
  Param,
  Post,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { SellerActivityItem } from '@taskstream/shared-schemas';
import { SessionAuthGuard, type AuthenticatedRequest } from '../identity/session-auth.guard';
import { WalletVerifiedGuard } from '../identity/wallet-verified.guard';
import { EscrowService } from './escrow.service';
import { OrderWorkspaceService } from './order-workspace.service';
import { SellerNotificationHub } from './seller-notification.hub';

@Controller()
export class EscrowController {
  constructor(
    @Inject(EscrowService) private readonly escrow: EscrowService,
    @Inject(OrderWorkspaceService) private readonly workspace: OrderWorkspaceService,
    @Inject(SellerNotificationHub) private readonly sellerHub: SellerNotificationHub,
  ) {}

  @Get('orders/activity')
  @UseGuards(SessionAuthGuard)
  listActivity(@Req() request: AuthenticatedRequest) {
    return this.escrow.listSellerActivity(request.userId!);
  }

  /**
   * SSE: el Freelancer recibe al instante nuevas solicitudes de trabajo
   * mientras tiene la plataforma abierta.
   */
  @Sse('orders/activity/stream')
  @UseGuards(SessionAuthGuard)
  activityStream(@Req() request: AuthenticatedRequest): Observable<MessageEvent> {
    const userId = request.userId!;
    return new Observable<MessageEvent>((subscriber) => {
      const push = (item: SellerActivityItem) => {
        if (item.sellerConfirmed || item.lifecycleStatus !== 'PENDING_ESCROW_FUNDING') return;
        subscriber.next({
          data: { type: 'WORK_REQUEST_PENDING', item },
        } as MessageEvent);
      };

      const unsubscribe = this.sellerHub.subscribe(userId, push);

      void this.escrow.listSellerActivity(userId).then((items) => {
        for (const item of items) push(item);
      });

      const heartbeat = setInterval(() => {
        subscriber.next({ type: 'ping', data: { type: 'ping' } } as MessageEvent);
      }, 25_000);

      return () => {
        unsubscribe();
        clearInterval(heartbeat);
      };
    });
  }

  @Get('orders/:taskId/escrow')
  @UseGuards(SessionAuthGuard)
  getEscrow(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.escrow.getFundingView(request.userId!, taskId);
  }

  /** Emprendedor acepta → fondeo instantáneo a escrow. */
  @Post('orders/:taskId/escrow/confirm')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  confirmAsSeller(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.escrow.confirmAsSeller(request.userId!, taskId);
  }

  /** Emprendedor rechaza → el dinero nunca se manda (no exige wallet). */
  @Post('orders/:taskId/escrow/reject')
  @UseGuards(SessionAuthGuard)
  rejectBySeller(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.escrow.rejectBySeller(request.userId!, taskId);
  }

  /** Contratador se arrepiente → el dinero nunca se manda (no exige wallet). */
  @Post('orders/:taskId/escrow/cancel')
  @UseGuards(SessionAuthGuard)
  cancelByBuyer(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.escrow.cancelByBuyer(request.userId!, taskId);
  }

  /** Workspace post-aceptar: chat, anexos, plazo 7d y contexto. */
  @Get('orders/:taskId/workspace')
  @UseGuards(SessionAuthGuard)
  getWorkspace(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.workspace.getWorkspace(request.userId!, taskId);
  }

  @Post('orders/:taskId/workspace/messages')
  @UseGuards(SessionAuthGuard)
  sendWorkspaceMessage(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
  ) {
    return this.workspace.sendMessage(request.userId!, taskId, body);
  }

  @Post('orders/:taskId/escrow/fund')
  @HttpCode(202)
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  fundEscrow(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.escrow.fundEscrow(request.userId!, taskId);
  }

  @Post('webhooks/rafiki')
  @HttpCode(204)
  handleRafikiWebhook(
    @Body() body: unknown,
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.escrow.handleRafikiWebhook(body, authorization);
  }

  @Post('orders/:taskId/escrow/simulate-release')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  simulateRelease(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.escrow.simulateRelease(request.userId!, taskId);
  }

  @Post('orders/:taskId/escrow/simulate-refund')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  simulateRefund(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.escrow.simulateRefund(request.userId!, taskId);
  }
}
