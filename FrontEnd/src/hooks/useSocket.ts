import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socket';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketService.isConnected());
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  const reconnect = useCallback(() => {
    setReconnectAttempts(prev => prev + 1);
    socketService.reconnect();
  }, []);

  return {
    isConnected,
    reconnectAttempts,
    reconnect,
  };
};