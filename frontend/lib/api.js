import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export const getStats = () => api.get('/dashboard/stats');

export const getQueue = (page = 1, filters = {}) => {
  const params = new URLSearchParams({ page, ...filters });
  return api.get(`/dashboard/queue?${params.toString()}`);
};

export const resolveQueueItem = (id, decision, reviewerNotes) => {
  return api.patch(`/dashboard/queue/${id}/resolve`, { decision, reviewerNotes });
};

export const getCampaignReport = (campaignId) => api.get(`/dashboard/campaigns/${campaignId}/report`);

export const getSubmissionDetail = (submissionId) => api.get(`/dashboard/submissions/${submissionId}`);
