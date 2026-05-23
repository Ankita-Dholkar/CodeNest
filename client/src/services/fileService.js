import api from './api';

export const fileService = {
  // GET /api/files/:projectId
  getByProject: (projectId) =>
    api.get(`/api/files/${projectId}`).then((r) => r.data),

  // POST /api/files  { projectId, path, content, language }
  create: (payload) => api.post('/api/files', payload).then((r) => r.data),

  // PATCH /api/files/:id  { content }
  update: (id, content) =>
    api.patch(`/api/files/${id}`, { content }).then((r) => r.data),

  // DELETE /api/files/:id
  remove: (id) => api.delete(`/api/files/${id}`).then((r) => r.data),
};
