import { api } from './api';

/**
 * Sustainability services for the farmer app.
 * All endpoints require a valid farmer JWT (set via authService.getSession()).
 */

/**
 * Get all active sustainability goals.
 * @returns {Promise<Array>} list of goals
 */
export async function getGoals() {
  const res = await api('/api/sustainability/goals');
  return res.goals || [];
}

/**
 * Get the farmer's own sustainability submissions and total score.
 * @returns {Promise<{ submissions: Array, totalScore: number }>}
 */
export async function getProfile() {
  return api('/api/sustainability/profile');
}

/**
 * Start a new sustainability submission for a goal.
 * @param {string} goalId
 * @returns {Promise<{ submission }>}
 */
export async function createSubmission(goalId) {
  return api('/api/sustainability/submissions', {
    method: 'POST',
    body: JSON.stringify({ goalId }),
  });
}

/**
 * Record metadata for a piece of evidence already uploaded to Supabase Storage.
 * @param {string} submissionId
 * @param {{ fileName: string, fileType: string, fileSizeBytes: number, filePath: string }} evidenceData
 * @returns {Promise<{ evidence }>}
 */
export async function addEvidence(submissionId, evidenceData) {
  return api(`/api/sustainability/submissions/${submissionId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(evidenceData),
  });
}

/**
 * Submit a sustainability submission for review.
 * Requires at least one piece of evidence to have been uploaded first.
 * @param {string} submissionId
 * @returns {Promise<{ submission }>}
 */
export async function submitSubmission(submissionId) {
  return api(`/api/sustainability/submissions/${submissionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
