export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a project-specific room
    socket.on('join-project', (projectId) => {
      socket.join(projectId);
      console.log(`   ↳ ${socket.id} joined project room: ${projectId}`);
    });

    // Leave a project room (fired when user switches projects)
    socket.on('leave-project', (projectId) => {
      socket.leave(projectId);
      console.log(`   ↳ ${socket.id} left project room: ${projectId}`);
    });

    // Broadcast file changes to all other clients in the room
    socket.on('file-change', ({ projectId, path, content }) => {
      socket.to(projectId).emit('file-update', { path, content });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
