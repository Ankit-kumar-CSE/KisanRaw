import { supabase } from '../config/supabase.js';

const BUCKET = 'kisan-documents';
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes — enough time to upload

/**
 * Generate a signed upload URL for a private file in Supabase Storage.
 * The path is constructed by the backend — never trusted from the client.
 *
 * @param {string} path  Storage path within the bucket e.g. "compensation/uuid/file.pdf"
 * @returns {Promise<{ signedUrl: string, path: string }>}
 */
export async function createUploadUrl(path) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw error;
  return { signedUrl: data.signedUrl, path };
}

/**
 * Generate a signed download URL for a private file.
 *
 * @param {string} path  Storage path within the bucket
 * @returns {Promise<string>} signed URL valid for SIGNED_URL_TTL_SECONDS
 */
export async function createDownloadUrl(path) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Validate file upload parameters from the request body.
 * Returns a normalized { fileName, fileType, fileSizeBytes } or throws HttpError.
 */
export function validateUploadRequest(body) {
  const { fileName, fileType, fileSizeBytes } = body || {};
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

  if (!fileName || typeof fileName !== 'string') {
    throw { status: 400, message: 'file_name_required' };
  }
  if (!ALLOWED_TYPES.includes(fileType)) {
    throw { status: 400, message: 'invalid_file_type', extra: { allowed: ALLOWED_TYPES } };
  }
  if (!fileSizeBytes || Number(fileSizeBytes) > MAX_BYTES) {
    throw { status: 400, message: 'file_too_large', extra: { maxMB: 10 } };
  }

  const ext = fileType === 'application/pdf' ? 'pdf'
    : fileType === 'image/png' ? 'png'
    : fileType === 'image/webp' ? 'webp'
    : 'jpg';

  return { fileName: String(fileName).slice(0, 200), fileType, fileSizeBytes: Number(fileSizeBytes), ext };
}
