/**
 * Cloudinary utility for QuickVet
 *
 * Handles secure upload, deletion, and signed-URL generation for
 * veterinarian verification documents. All assets are uploaded as
 * "authenticated" resources — they cannot be accessed with a plain URL
 * and require a server-side signed URL to view.
 *
 * Folder structure: quickvet/vets/{vetId}/{docKey}_{uuid}
 *
 * Environment variables required:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

/** Allowed MIME types for verification documents */
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

/** Allowed file extensions (mirrors MIME types) */
export const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

/** Max file size in bytes (10 MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Signed URL expiry in seconds (1 hour) */
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

/** Root Cloudinary folder for all QuickVet assets */
const ROOT_FOLDER = 'quickvet/vets';

// ──────────────────────────────────────────────
// Initialisation
// ──────────────────────────────────────────────

let initialised = false;

function ensureInitialised() {
  if (initialised) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  initialised = true;
}

// ──────────────────────────────────────────────
// Validation helpers
// ──────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file before uploading to Cloudinary.
 * Checks MIME type and file size.
 */
export function validateFile(
  mimeType: string,
  fileSizeBytes: number,
  originalName: string
): FileValidationResult {
  const ext = originalName.slice(originalName.lastIndexOf('.')).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted formats: PDF, JPG, JPEG, PNG. Received: ${mimeType}`,
    };
  }

  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`,
    };
  }

  return { valid: true };
}

// ──────────────────────────────────────────────
// Upload
// ──────────────────────────────────────────────

export interface UploadedDocumentMeta {
  /** Cloudinary public_id – use this to generate signed URLs or delete the asset */
  cloudinaryPublicId: string;
  /** Cloudinary resource type: 'raw' for PDFs, 'image' for images */
  resourceType: 'raw' | 'image';
  /** Original uploaded file name */
  fileName: string;
  /** MIME type of the uploaded file */
  fileType: string;
  /** File size in bytes */
  fileSize: number;
  /** ISO timestamp of upload */
  uploadedAt: string;
}

/**
 * Uploads a document buffer to Cloudinary.
 *
 * @param buffer   - File content as a Buffer (from multer memory storage)
 * @param mimeType - MIME type of the file
 * @param originalName - Original filename (used for extension detection)
 * @param vetId    - The clinic/vet ID (used to build the folder path)
 * @param docKey   - Logical document key (e.g. 'veterinaryLicense')
 * @returns Cloudinary upload metadata
 */
export async function uploadDocument(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  vetId: string,
  docKey: string
): Promise<UploadedDocumentMeta> {
  ensureInitialised();

  const isPdf = mimeType === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'image';
  const folder = `${ROOT_FOLDER}/${vetId}`;
  const uniqueSuffix = crypto.randomBytes(8).toString('hex');
  const publicId = `${folder}/${docKey}_${uniqueSuffix}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType,
        type: 'authenticated',      // Private – cannot be accessed via plain URL
        overwrite: false,
        use_filename: false,        // Use our randomised publicId, not original filename
        unique_filename: false,
      },
      (error, result) => {
        if (error || !result) {
          return reject(new Error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`));
        }
        resolve({
          cloudinaryPublicId: result.public_id,
          resourceType,
          fileName: originalName,
          fileType: mimeType,
          fileSize: result.bytes,
          uploadedAt: new Date().toISOString(),
        });
      }
    );

    uploadStream.end(buffer);
  });
}

// ──────────────────────────────────────────────
// Delete
// ──────────────────────────────────────────────

/**
 * Permanently deletes a document from Cloudinary.
 * Called when a vet replaces an existing document.
 *
 * @param publicId     - Cloudinary public_id
 * @param resourceType - 'raw' for PDFs, 'image' for images
 */
export async function deleteDocument(
  publicId: string,
  resourceType: 'raw' | 'image' = 'image'
): Promise<void> {
  ensureInitialised();

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
      invalidate: true,
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary deletion returned unexpected result: ${result.result}`);
    }
  } catch (err: any) {
    // Log but don't crash the request — stale Cloudinary assets are recoverable
    console.error(`[Cloudinary] Failed to delete asset "${publicId}":`, err?.message || err);
    throw err;
  }
}

// ──────────────────────────────────────────────
// Signed URL (admin-only document viewing)
// ──────────────────────────────────────────────

export interface SignedUrlResult {
  signedUrl: string;
  expiresAt: string; // ISO timestamp
}

/**
 * Generates a time-limited signed URL for an authenticated Cloudinary asset.
 * Only the server can generate these — they expire after SIGNED_URL_EXPIRY_SECONDS.
 *
 * @param publicId     - Cloudinary public_id
 * @param resourceType - 'raw' for PDFs, 'image' for images
 * @param attachment   - If true, Cloudinary sends Content-Disposition: attachment → forces download
 */
export function generateSignedUrl(
  publicId: string,
  resourceType: 'raw' | 'image' = 'image',
  attachment = false
): SignedUrlResult {
  ensureInitialised();

  const expiresAtTimestamp = Math.floor(Date.now() / 1000) + SIGNED_URL_EXPIRY_SECONDS;

  const signedUrl = cloudinary.utils.private_download_url(publicId, '', {
    resource_type: resourceType,
    type: 'authenticated',
    expires_at: expiresAtTimestamp,
    attachment,
  });

  return {
    signedUrl,
    expiresAt: new Date(expiresAtTimestamp * 1000).toISOString(),
  };
}

// ──────────────────────────────────────────────
// Status check (for /api/health)
// ──────────────────────────────────────────────

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
