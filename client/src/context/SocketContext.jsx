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
    const backendUrl = import.meta.env.VITE_API_URL || 'https://capital-rush-backend.onrender.com';

    const socketInstance = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to server.');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Reconnect if disconnected by server
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
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

    // Device wake-up & network resume listener
    const handleWakeup = () => {
      if (document.visibilityState === 'visible' && !socketInstance.connected) {
        console.log('[Socket] Device wake-up detected, reconnecting socket...');
        socketInstance.connect();
      }
    };

    document.addEventListener('visibilitychange', handleWakeup);
    window.addEventListener('online', handleWakeup);

    setSocket(socketInstance);

    return () => {
      document.removeEventListener('visibilitychange', handleWakeup);
      window.removeEventListener('online', handleWakeup);
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
