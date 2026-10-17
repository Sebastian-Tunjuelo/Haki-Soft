import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
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
import { MarketplaceService } from './marketplace.service';

interface BinaryResponse {
  setHeader(name: string, value: string): void;
  send(body: Buffer): void;
}

const imageUpload = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

@Controller('marketplace')
export class MarketplaceController {
  constructor(@Inject(MarketplaceService) private readonly marketplace: MarketplaceService) {}

  @Get('categories')
  listCategories() {
    return this.marketplace.listCategories();
  }

  @Get('gigs')
  listGigs(@Query() query: Record<string, string | undefined>) {
    return this.marketplace.listGigs(query);
  }

  @Get('gigs/:gigId')
  getGig(@Param('gigId') gigId: string) {
    return this.marketplace.getGig(gigId);
  }

  @Get('gigs/:gigId/reviews')
  listGigReviews(@Param('gigId') gigId: string, @Headers('authorization') authorization?: string) {
    return this.marketplace.listReviews('GIG', gigId, authorization);
  }

  @Post('gigs/:gigId/reviews')
  @HttpCode(201)
  @UseGuards(SessionAuthGuard)
  createGigReview(
    @Req() request: AuthenticatedRequest,
    @Param('gigId') gigId: string,
    @Body() body: unknown,
  ) {
    return this.marketplace.createReview(request.userId!, 'GIG', gigId, body);
  }

  @Post('gigs')
  @HttpCode(201)
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  createGig(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    return this.marketplace.createGig(request.userId!, body, idempotencyKey);
  }

  @Patch('gigs/:gigId')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  updateGig(
    @Req() request: AuthenticatedRequest,
    @Param('gigId') gigId: string,
    @Body() body: unknown,
  ) {
    return this.marketplace.updateGig(request.userId!, gigId, body);
  }

  /** El dueño elimina (desactiva) su Gig; deja de aparecer en el catálogo. */
  @Delete('gigs/:gigId')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  deleteGig(@Req() request: AuthenticatedRequest, @Param('gigId') gigId: string) {
    return this.marketplace.deleteGig(request.userId!, gigId);
  }

  @Patch('gigs/:gigId/page')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  updateGigPage(
    @Req() request: AuthenticatedRequest,
    @Param('gigId') gigId: string,
    @Body() body: unknown,
  ) {
    return this.marketplace.updateGigPage(request.userId!, gigId, body);
  }

  @Patch('publications/:publicationId')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  updatePublication(
    @Req() request: AuthenticatedRequest,
    @Param('publicationId') publicationId: string,
    @Body() body: unknown,
  ) {
    return this.marketplace.updatePublication(request.userId!, publicationId, body);
  }

  @Post('gigs/:gigId/media')
  @HttpCode(201)
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  @UseInterceptors(imageUpload)
  uploadGigMedia(
    @Req() request: AuthenticatedRequest,
    @Param('gigId') gigId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.marketplace.uploadMedia(request.userId!, 'GIG', gigId, toUpload(file));
  }

  @Get('publications')
  listPublications(@Query() query: Record<string, string | undefined>) {
    return this.marketplace.listPublications(query);
  }

  @Get('publications/:publicationId')
  getPublication(@Param('publicationId') publicationId: string) {
    return this.marketplace.getPublication(publicationId);
  }

  @Get('publications/:publicationId/reviews')
  listPublicationReviews(
    @Param('publicationId') publicationId: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.marketplace.listReviews('PUBLICATION', publicationId, authorization);
  }

  @Post('publications/:publicationId/reviews')
  @HttpCode(201)
  @UseGuards(SessionAuthGuard)
  createPublicationReview(
    @Req() request: AuthenticatedRequest,
    @Param('publicationId') publicationId: string,
    @Body() body: unknown,
  ) {
    return this.marketplace.createReview(request.userId!, 'PUBLICATION', publicationId, body);
  }

  @Post('publications')
  @HttpCode(201)
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  createPublication(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    return this.marketplace.createPublication(request.userId!, body, idempotencyKey);
  }

  @Patch('publications/:publicationId/page')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  updatePublicationPage(
    @Req() request: AuthenticatedRequest,
    @Param('publicationId') publicationId: string,
    @Body() body: unknown,
  ) {
    return this.marketplace.updatePublicationPage(request.userId!, publicationId, body);
  }

  @Post('publications/:publicationId/media')
  @HttpCode(201)
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  @UseInterceptors(imageUpload)
  uploadPublicationMedia(
    @Req() request: AuthenticatedRequest,
    @Param('publicationId') publicationId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.marketplace.uploadMedia(request.userId!, 'PUBLICATION', publicationId, toUpload(file));
  }

  @Post('publications/:publicationId/cancel')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  cancelPublication(
    @Req() request: AuthenticatedRequest,
    @Param('publicationId') publicationId: string,
    @Body() body: unknown,
  ) {
    return this.marketplace.cancelPublication(request.userId!, publicationId, body);
  }

  @Delete('media/:mediaId')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  deleteMedia(@Req() request: AuthenticatedRequest, @Param('mediaId') mediaId: string) {
    return this.marketplace.deleteMedia(request.userId!, mediaId);
  }

  @Get('media/:mediaId')
  async getMedia(@Param('mediaId') mediaId: string, @Res() response: BinaryResponse): Promise<void> {
    const file = await this.marketplace.readMediaFile(mediaId);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Cache-Control', 'public, max-age=3600');
    response.send(file.bytes);
  }
}

function toUpload(file: Express.Multer.File | undefined):
  | { buffer: Buffer; mimetype: string; size: number }
  | undefined {
  if (!file?.buffer) return undefined;
  return { buffer: file.buffer, mimetype: file.mimetype, size: file.size };
}
