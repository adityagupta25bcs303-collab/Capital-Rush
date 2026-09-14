let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Join team specific room
    socket.on('join_team', (teamId) => {
      if (teamId) {
        socket.join(`team:${teamId}`);
      }
    });

    // Leave team room
    socket.on('leave_team', (teamId) => {
      if (teamId) {
        socket.leave(`team:${teamId}`);
      }
    });

    // Join leaderboard updates
    socket.on('join_leaderboard', () => {
      socket.join('leaderboard');
    });

    // Join admin stream
    socket.on('join_admin', () => {
      socket.join('admin_channel');
    });
  });

  return io;
};

const getIO = () => ioInstance;

const emitToTeam = (teamId, event, data) => {
  if (ioInstance) {
    ioInstance.to(`team:${teamId}`).emit(event, data);
  }
};

const emitToAdmin = (event, data) => {
  if (ioInstance) {
    ioInstance.to('admin_channel').emit(event, data);
  }
};

const emitLeaderboardUpdate = (data) => {
  if (ioInstance) {
    ioInstance.emit('leaderboard_updated', data);
  }
};

const emitRoundUpdate = (roundData) => {
  if (ioInstance) {
    ioInstance.emit('round_updated', roundData);
  }
};

const emitGameStatusUpdate = (statusData) => {
  if (ioInstance) {
    ioInstance.emit('game_status_updated', statusData);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToTeam,
  emitToAdmin,
  emitLeaderboardUpdate,
  emitRoundUpdate,
  emitGameStatusUpdate
};
