import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors for handling requests and responses
api.interceptors.request.use(
  (config) => {
    // You can add logic here to add auth tokens, etc.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle errors globally
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

// --- API Methods ---

/**
 * Fetches dashboard statistics.
 * @returns {Promise<any>}
 */
export const getStats = () => api.get('/api/dashboard/stats');

/**
 * Fetches the human review queue.
 * @param {object} params - Query parameters for pagination, sorting, filtering.
 * @param {number} params.page - The page number.
 * @param {number} params.limit - The number of items per page.
 * @param {string} params.sortBy - The field to sort by.
 * @param {string} params.sortOrder - The sort order ('asc' or 'desc').
 * @param {string} params.status - The status to filter by.
 * @param {string} params.search - The search term.
 * @returns {Promise<any>}
 */
export const getQueue = (params) => api.get('/api/dashboard/queue', { params });

/**
 * Resolves a queue item by approving or rejecting it.
 * @param {string} id - The ID of the submission to resolve.
 * @param {object} data - The resolution data.
 * @param {('APPROVED'|'REJECTED')} data.status - The new status.
 * @param {string} data.reviewerNotes - Notes from the reviewer.
 * @returns {Promise<any>}
 */
export const resolveQueueItem = (id, data) => api.post(`/api/dashboard/queue/${id}/resolve`, data);

/**
 * Fetches the details for a specific submission.
 * @param {string} id - The ID of the submission.
 * @returns {Promise<any>}
 */
export const getSubmissionDetail = (id) => api.get(`/api/dashboard/submissions/${id}`);

/**
 * Fetches a campaign report.
 * @param {object} params - Query parameters for the report.
 * @returns {Promise<any>}
 */
export const getCampaignReport = (params) => api.get('/api/dashboard/reports/campaign', { params });

export { api };
