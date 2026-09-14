import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState(null);
  const [lastLeaderboardUpdate, setLastLeaderboardUpdate] = useState(null);
  const [lastRoundUpdate, setLastRoundUpdate] = useState(null);
  const [lastGameStatusUpdate, setLastGameStatusUpdate] = useState(null);

  useEffect(() => {
    // Connect to current origin in unified mode or localhost in dev
    const socketInstance = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to server.');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected.');
      setIsConnected(false);
    });

    socketInstance.on('balance_updated', (data) => {
      console.log('[Socket] Received balance_updated:', data);
      setLastBalanceUpdate(data);
    });

    socketInstance.on('leaderboard_updated', (data) => {
      setLastLeaderboardUpdate(data);
    });

    socketInstance.on('round_updated', (data) => {
      setLastRoundUpdate(data);
    });

    socketInstance.on('game_status_updated', (data) => {
      setLastGameStatusUpdate(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinTeamRoom = (teamId) => {
    if (socket && teamId) {
      socket.emit('join_team', teamId);
    }
  };

  const leaveTeamRoom = (teamId) => {
    if (socket && teamId) {
      socket.emit('leave_team', teamId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinTeamRoom,
        leaveTeamRoom,
        lastBalanceUpdate,
        lastLeaderboardUpdate,
        lastRoundUpdate,
        lastGameStatusUpdate
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
