import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('codenest_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — log errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err.response?.data?.message || err.message);
    return Promise.reject(err);
  }
);

export default api;
