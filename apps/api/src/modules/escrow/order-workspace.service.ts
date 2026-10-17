import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  OrderWorkspaceViewSchema,
  SendOrderWorkspaceMessageInputSchema,
  type OrderWorkspaceView,
} from '@taskstream/shared-schemas';
import { DomainError } from '../identity/domain-error';
import { PrismaService } from '../../prisma/prisma.service';
import { extractProjectBrief, type EscrowRepository } from './escrow.types';
import { ESCROW_REPOSITORY } from './escrow.tokens';

type MemoryMessage = {
  messageId: string;
  taskId: string;
  senderId: string;
  senderDisplayName: string;
  senderRole: 'buyer' | 'seller';
  body: string;
  attachmentFileName: string | null;
  createdAt: Date;
};

@Injectable()
export class OrderWorkspaceService {
  private readonly memoryMessages = new Map<string, MemoryMessage[]>();

  constructor(
    @Inject(ESCROW_REPOSITORY) private readonly escrow: EscrowRepository,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async getWorkspace(userId: string, taskId: string): Promise<OrderWorkspaceView> {
    const order = await this.requireParty(userId, taskId);
    if (order.lifecycleStatus === 'PENDING_ESCROW_FUNDING' || order.lifecycleStatus === 'CANCELLED') {
      throw new DomainError(409, 'WORKSPACE_NOT_READY');
    }

    const viewerRole = order.buyerId === userId ? 'buyer' : 'seller';
    const deliveryStartedAt = order.fundsLockedAt;
    const deliveryDeadlineAt =
      deliveryStartedAt != null
        ? new Date(deliveryStartedAt.getTime() + order.initialDeliveryDays * 24 * 60 * 60 * 1000)
        : null;

    const messages = await this.listMessages(order.taskId, order.buyerId, order.sellerId);

    return OrderWorkspaceViewSchema.parse({
      taskId: order.taskId,
      title: order.title,
      scopeDescription: order.scopeDescription,
      projectBrief: extractProjectBrief(order.scopeDescription) || null,
      lifecycleStatus: order.lifecycleStatus,
      totalAmountUSDInCents: order.totalAmountUSDInCents,
      buyerDisplayName: order.buyerDisplayName,
      sellerDisplayName: order.sellerDisplayName,
      viewerRole,
      deliveryStartedAt: deliveryStartedAt?.toISOString() ?? null,
      deliveryDeadlineAt: deliveryDeadlineAt?.toISOString() ?? null,
      initialDeliveryDays: order.initialDeliveryDays,
      messages,
    });
  }

  async sendMessage(userId: string, taskId: string, body: unknown): Promise<OrderWorkspaceView> {
    const input = SendOrderWorkspaceMessageInputSchema.safeParse(body);
    if (!input.success) throw new DomainError(400, 'VALIDATION_ERROR');

    const order = await this.requireParty(userId, taskId);
    if (order.lifecycleStatus !== 'ESCROW_LOCKED') {
      throw new DomainError(409, 'WORKSPACE_CHAT_CLOSED');
    }

    const senderRole = order.buyerId === userId ? 'buyer' : 'seller';
    const senderDisplayName =
      senderRole === 'buyer' ? order.buyerDisplayName : order.sellerDisplayName;

    if (this.prisma.client) {
      await this.prisma.client.taskOrderChatMessage.create({
        data: {
          id: randomUUID(),
          taskOrderId: taskId,
          senderId: userId,
          body: input.data.body.trim(),
          attachmentFileName: input.data.attachmentFileName?.trim() || null,
        },
      });
    } else {
      const list = this.memoryMessages.get(taskId) ?? [];
      list.push({
        messageId: randomUUID(),
        taskId,
        senderId: userId,
        senderDisplayName,
        senderRole,
        body: input.data.body.trim(),
        attachmentFileName: input.data.attachmentFileName?.trim() || null,
        createdAt: new Date(),
      });
      this.memoryMessages.set(taskId, list);
    }

    return this.getWorkspace(userId, taskId);
  }

  private async requireParty(userId: string, taskId: string) {
    const order = await this.escrow.findOrder(taskId);
    if (!order) throw new DomainError(404, 'ORDER_NOT_FOUND');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new DomainError(403, 'ESCROW_FORBIDDEN');
    }
    return order;
  }

  private async listMessages(taskId: string, buyerId: string, sellerId: string) {
    if (this.prisma.client) {
      const rows = await this.prisma.client.taskOrderChatMessage.findMany({
        where: { taskOrderId: taskId },
        include: { sender: { select: { displayName: true } } },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });
      return rows.map((row) => ({
        messageId: row.id,
        senderId: row.senderId,
        senderDisplayName: row.sender.displayName,
        senderRole: (row.senderId === buyerId ? 'buyer' : 'seller') as 'buyer' | 'seller',
        body: row.body,
        attachmentFileName: row.attachmentFileName,
        createdAt: row.createdAt.toISOString(),
      }));
    }

    return (this.memoryMessages.get(taskId) ?? []).map((row) => ({
      messageId: row.messageId,
      senderId: row.senderId,
      senderDisplayName: row.senderDisplayName,
      senderRole: row.senderRole,
      body: row.body,
      attachmentFileName: row.attachmentFileName,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
