import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

type DocResourceType = 'image' | 'raw' | 'video';

@Injectable()
export class CloudinaryService {
  // For avatar — unsigned preset, public delivery
  uploadAvatar(base64: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(base64, {
        folder: 'mtpocket/avatars',
        resource_type: 'image',
      }, (err, result) => {
        if (err || !result) return reject(err);
        resolve(result);
      });
    });
  }

  // For KYC documents — authenticated delivery, private folder per user.
  // resource_type is 'auto' at upload time (images vs PDFs), but the
  // *actual* resolved resource_type on the returned result is what must
  // be saved and re-used later to build a valid signed URL.
  uploadDocument(buffer: Buffer, mimetype: string, userId: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `mtpocket/documents/${userId}`,
          resource_type: 'auto',
          type: 'authenticated', // private — requires a signed URL to view
        },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve(result);
        },
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  // Deletes a previously-uploaded document (used when a user resubmits,
  // so the old private asset doesn't linger in Cloudinary forever).
  async deleteDocument(publicId: string, resourceType: DocResourceType): Promise<void> {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
    });
  }

  // Internal-only: builds a signed URL used by OUR backend to pull the raw
  // bytes of a private document from Cloudinary. This URL is NEVER sent to
  // the browser — AdminService.getDocumentFile() fetches it server-side
  // and streams the response through our own JWT-guarded endpoint instead.
  // That sidesteps needing Cloudinary's paid "Token authentication"
  // feature entirely: "expiry" is just your existing 15-minute access
  // token TTL, since every request has to carry a valid one.
  getSignedFetchUrl(publicId: string, resourceType: DocResourceType = 'image'): string {
    return cloudinary.url(publicId, {
      type: 'authenticated',
      resource_type: resourceType,
      sign_url: true,
    });
  }
}