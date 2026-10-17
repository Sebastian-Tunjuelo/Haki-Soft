import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SessionAuthGuard, type AuthenticatedRequest } from '../identity/session-auth.guard';
import { WalletVerifiedGuard } from '../identity/wallet-verified.guard';
import { DeliverablesService } from './deliverables.service';

const deliverableUpload = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

interface BinaryResponse {
  setHeader(name: string, value: string): void;
  status(code: number): BinaryResponse;
  send(body: Buffer | string): void;
}

@Controller()
export class DeliverablesController {
  constructor(@Inject(DeliverablesService) private readonly deliverables: DeliverablesService) {}

  @Get('orders/:taskId/deliverables')
  @UseGuards(SessionAuthGuard)
  list(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.deliverables.list(request.userId!, taskId);
  }

  @Get('orders/:taskId/clock')
  @UseGuards(SessionAuthGuard)
  clock(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.deliverables.getClock(request.userId!, taskId);
  }

  @Get('me/delivery-notices')
  @UseGuards(SessionAuthGuard)
  deliveryNotices(@Req() request: AuthenticatedRequest) {
    return this.deliverables.listBuyerNotices(request.userId!);
  }

  @Delete('me/delivery-notices/:taskId')
  @HttpCode(204)
  @UseGuards(SessionAuthGuard)
  dismissNotice(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    this.deliverables.dismissBuyerNotice(request.userId!, taskId);
  }

  @Get('me/acceptance-notices')
  @UseGuards(SessionAuthGuard)
  acceptanceNotices(@Req() request: AuthenticatedRequest) {
    return this.deliverables.listSellerAcceptanceNotices(request.userId!);
  }

  @Delete('me/acceptance-notices/:taskId')
  @HttpCode(204)
  @UseGuards(SessionAuthGuard)
  dismissAcceptanceNotice(@Req() request: AuthenticatedRequest, @Param('taskId') taskId: string) {
    this.deliverables.dismissSellerAcceptanceNotice(request.userId!, taskId);
  }

  @Post('orders/:taskId/deliverables/uploads')
  @HttpCode(201)
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  beginUpload(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
  ) {
    return this.deliverables.beginUpload(request.userId!, taskId, body);
  }

  @Post('orders/:taskId/deliverables/:deliverableId/content')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  @UseInterceptors(deliverableUpload)
  putContent(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Param('deliverableId') deliverableId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const bytes = file?.buffer ?? Buffer.alloc(0);
    return this.deliverables.putContent(request.userId!, taskId, deliverableId, bytes);
  }

  @Post('orders/:taskId/deliverables/:deliverableId/complete')
  @HttpCode(202)
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  complete(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Param('deliverableId') deliverableId: string,
  ) {
    return this.deliverables.complete(request.userId!, taskId, deliverableId);
  }

  @Post('orders/:taskId/deliverables/:deliverableId/accept')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  accept(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Param('deliverableId') deliverableId: string,
  ) {
    return this.deliverables.acceptDeliverable(request.userId!, taskId, deliverableId);
  }

  @Post('orders/:taskId/revisions')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  requestRevision(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
  ) {
    return this.deliverables.requestRevision(request.userId!, taskId, body);
  }

  @Post('orders/:taskId/disputes')
  @HttpCode(201)
  @UseGuards(SessionAuthGuard)
  openDispute(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() body: unknown,
  ) {
    return this.deliverables.openDispute(request.userId!, taskId, body);
  }

  @Get('admin/disputes')
  @UseGuards(SessionAuthGuard)
  listAdminDisputes(@Req() request: AuthenticatedRequest) {
    return this.deliverables.listAdminDisputes(request.userId!);
  }

  @Get('admin/disputes/:disputeId')
  @UseGuards(SessionAuthGuard)
  getAdminDispute(@Req() request: AuthenticatedRequest, @Param('disputeId') disputeId: string) {
    return this.deliverables.getAdminDispute(request.userId!, disputeId);
  }

  @Post('admin/disputes/:disputeId/resolve')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  resolveAdminDispute(
    @Req() request: AuthenticatedRequest,
    @Param('disputeId') disputeId: string,
    @Body() body: unknown,
  ) {
    return this.deliverables.resolveAdminDispute(request.userId!, disputeId, body);
  }

  @Get('orders/:taskId/deliverables/:deliverableId/ai-report')
  @UseGuards(SessionAuthGuard)
  async getAiReport(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Param('deliverableId') deliverableId: string,
    @Res() response: BinaryResponse,
  ) {
    const report = await this.deliverables.getAiReport(request.userId!, taskId, deliverableId);
    // Nest serializa `return null` como `{}`; forzar JSON null (SPEC-08).
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.status(200).send(JSON.stringify(report));
  }

  @Get('orders/:taskId/deliverables/:deliverableId/preview')
  @UseGuards(SessionAuthGuard)
  getPreview(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Param('deliverableId') deliverableId: string,
  ) {
    return this.deliverables.getPreview(request.userId!, taskId, deliverableId);
  }

  @Get('orders/:taskId/deliverables/:deliverableId/preview/content')
  @UseGuards(SessionAuthGuard)
  async previewContent(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Param('deliverableId') deliverableId: string,
    @Res() response: BinaryResponse,
  ) {
    const file = await this.deliverables.readPreviewBytes(request.userId!, taskId, deliverableId);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Cache-Control', 'private, max-age=60');
    response.status(200).send(file.bytes);
  }

  @Get('orders/:taskId/deliverables/:deliverableId/original')
  @UseGuards(SessionAuthGuard)
  getOriginal(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Param('deliverableId') deliverableId: string,
  ) {
    return this.deliverables.getOriginal(request.userId!, taskId, deliverableId);
  }

  @Get('orders/:taskId/deliverables/:deliverableId/original/content')
  @UseGuards(SessionAuthGuard)
  async originalContent(
    @Req() request: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Param('deliverableId') deliverableId: string,
    @Res() response: BinaryResponse,
  ) {
    const file = await this.deliverables.readOriginalBytes(request.userId!, taskId, deliverableId);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.status(200).send(file.bytes);
  }
}
