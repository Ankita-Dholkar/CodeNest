import api from './api';

export const projectService = {
  // GET /api/projects
  getAll: () => api.get('/api/projects').then((r) => r.data),

  // GET /api/projects/:id  → { project, files }
  getById: (id) => api.get(`/api/projects/${id}`).then((r) => r.data),

  // POST /api/projects  { name, description, template }
  create: (payload) => api.post('/api/projects', payload).then((r) => r.data),

  // DELETE /api/projects/:id
  remove: (id) => api.delete(`/api/projects/${id}`).then((r) => r.data),
};
