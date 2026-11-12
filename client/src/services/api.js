import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const workspaceId = localStorage.getItem('rf_active_workspace');
  if (workspaceId) {
    config.headers['x-workspace-id'] = workspaceId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('rf_token');
      localStorage.removeItem('rf_active_workspace');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
