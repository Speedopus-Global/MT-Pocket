import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import * as crypto from 'crypto';

export interface DocumentUploadResult {
  publicId: string;
  assetId: string;
  secureUrl: string;
  cloudinaryVersion: number;
  resourceType: 'image' | 'raw' | 'video';
  fileSize: number;
  fileHash: string;
  blurScore: number | null;
  imageWidth: number | null;
  imageHeight: number | null;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  // ── Avatar ─────────────────────────────────────────────────────────────
  uploadAvatar(base64: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(base64, {
        folder: 'mtpocket/avatars',
        resource_type: 'image',
        transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
      }, (err, result) => {
        if (err || !result) return reject(err);
        resolve(result);
      });
    });
  }

  // ── KYC Document ──────────────────────────────────────────────────────
  // Uploads as authenticated (private) asset. Never use the returned
  // secureUrl directly — generate a signed URL via getSignedFetchUrl().
  async uploadDocument(
    buffer: Buffer,
    mimeType: string,
    userId: string,
    version: number,
  ): Promise<DocumentUploadResult> {
    // Compute file hash BEFORE upload for duplicate detection
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `mtpocket/documents/${userId}`,
          public_id: `v${version}_${Date.now()}`,
          resource_type: 'auto',
          type: 'authenticated',
          // Quality analysis — gives us a score to flag blurry images
          quality_analysis: true,
          // Extract image metadata (dimensions)
          image_metadata: true,
        },
        (err, res) => {
          if (err || !res) return reject(err ?? new Error('Upload failed'));
          resolve(res);
        },
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    const resourceType = result.resource_type as 'image' | 'raw' | 'video';

    // quality_analysis.focus is Cloudinary's blur score (0=blurry, 1=sharp)
    // We scale to 0–100. Only available for images, not PDFs.
    const blurScore: number | null =
      resourceType === 'image' && result.quality_analysis?.focus != null
        ? Math.round(result.quality_analysis.focus * 100)
        : null;

    this.logger.log(
      `Document uploaded for user ${userId} v${version}: ${result.public_id} ` +
      `(${result.bytes} bytes, blur=${blurScore ?? 'N/A'})`,
    );

    return {
      publicId: result.public_id,
      assetId: result.asset_id,
      secureUrl: result.secure_url,
      cloudinaryVersion: result.version,
      resourceType,
      fileSize: result.bytes,
      fileHash,
      blurScore,
      imageWidth: result.width ?? null,
      imageHeight: result.height ?? null,
    };
  }

  // ── Secure access — generates a signed backend-fetch URL ──────────────
  // This URL is used by the backend to stream the file. NEVER sent to client.
  // The client always receives bytes streamed through the NestJS endpoint.
  getSignedFetchUrl(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image',
  ): string {
    return cloudinary.url(publicId, {
      type: 'authenticated',
      resource_type: resourceType,
      sign_url: true,
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  // Called when archiving is not sufficient and physical deletion is needed
  // (e.g. user data deletion request under privacy law).
  async deleteDocument(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video',
  ): Promise<void> {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
    });
    this.logger.log(`Document deleted from Cloudinary: ${publicId}`);
  }
}