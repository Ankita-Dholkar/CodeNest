import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('codenest_token') || null,
  loading: true,

  checkAuth: async () => {
    const { token } = get();
    if (!token) {
      set({ loading: false });
      return;
    }
    
    try {
      const res = await api.get('/api/auth/me');
      set({ user: res.data, loading: false });
    } catch (error) {
      localStorage.removeItem('codenest_token');
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('codenest_token', token);
    set({ user: userData, token });
  },

  register: async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('codenest_token', token);
    set({ user: userData, token });
  },

  logout: () => {
    localStorage.removeItem('codenest_token');
    set({ user: null, token: null });
  },
}));
