import { api } from './api';

/**
 * Compensation claim services for the farmer app.
 * All endpoints require a valid farmer JWT (set via authService.getSession()).
 */

/**
 * Get all compensation claims for the authenticated farmer.
 * @returns {Promise<Array>} list of claims
 */
export async function getClaims() {
  const res = await api('/api/compensation/claims');
  return res.claims || [];
}

/**
 * Get a single claim with documents and status history.
 * @param {string} claimId
 * @returns {Promise<{ claim, documents, statusHistory }>}
 */
export async function getClaim(claimId) {
  return api(`/api/compensation/claims/${claimId}`);
}

/**
 * Create a new compensation claim in draft status.
 * @param {{
 *   crop: string,
 *   damageType: string,
 *   incidentDate: string,
 *   affectedAreaAcres: number,
 *   estimatedLossQtl?: number,
 *   description?: string
 * }} claimData
 * @returns {Promise<{ claim }>}
 */
export async function createClaim(claimData) {
  return api('/api/compensation/claims', {
    method: 'POST',
    body: JSON.stringify(claimData),
  });
}

/**
 * Record metadata for a document already uploaded to Supabase Storage.
 * @param {string} claimId
 * @param {{ fileName: string, fileType: string, fileSizeBytes: number, filePath: string }} docData
 * @returns {Promise<{ document }>}
 */
export async function addDocument(claimId, docData) {
  return api(`/api/compensation/claims/${claimId}/documents`, {
    method: 'POST',
    body: JSON.stringify(docData),
  });
}

/**
 * Submit a claim (moves from 'draft' to 'submitted').
 * @param {string} claimId
 * @returns {Promise<{ claim }>}
 */
export async function submitClaim(claimId) {
  return api(`/api/compensation/claims/${claimId}/submit`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Get a signed Supabase Storage upload URL for a compensation document.
 * @param {string} claimId
 * @param {{ fileName: string, fileType: string, fileSizeBytes: number }} params
 * @returns {Promise<{ signedUrl: string, filePath: string }>}
 */
export async function getUploadUrl(claimId, { fileName, fileType, fileSizeBytes }) {
  return api('/api/compensation/upload-url', {
    method: 'POST',
    body: JSON.stringify({ claimId, fileName, fileType, fileSizeBytes }),
  });
}
