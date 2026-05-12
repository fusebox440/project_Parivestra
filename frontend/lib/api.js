import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getStats = () => api.get('/dashboard/stats');
export const getQueue = (params) => api.get('/dashboard/queue', { params });
export const resolveQueueItem = (id, data) => api.patch(`/dashboard/queue/${id}/resolve`, data);
export const getSubmissionDetail = (id) => api.get(`/dashboard/submissions/${id}`);
export const getCampaignReport = (id) => api.get(`/dashboard/campaigns/${id}/report`);

export { api };