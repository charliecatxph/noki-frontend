import { dataTagErrorSymbol } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface RfidSocketConfig {
  serverUrl?: string;
  enabled?: boolean;
  onRfidData?: (rfidData: RfidData) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  playSound?: boolean;
  soundFile?: string;
  pulseDuration?: number;
}

interface RfidSocketReturn {
  rfidData: RfidData;
  isOnline: boolean;
  isPulsing: boolean;
  setRfidData: (data: RfidData) => void;
  socket: Socket | null;
}

interface RfidData {
  type: string;
  data: string;
}

export function useRfidSocket(config: RfidSocketConfig = {}): RfidSocketReturn {
  const {
    serverUrl = "http://localhost:8000",
    enabled,
    onRfidData,
    onConnectionChange,
    playSound = true,
    soundFile = "notification.mp3",
    pulseDuration = 1000,
  } = config;

  const socketRef = useRef<Socket | null>(null);
  const [rfidData, setRfidData] = useState<RfidData>({
    type: "",
    data: "",
  });
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    socketRef.current = io(serverUrl);

    socketRef.current.on("sig", (data: { type: string, data: string }) => {
      setRfidData(data);
      setIsOnline(true);
      console.log(data)
      setIsPulsing(true);
  
      if (playSound) {
        try {
          const audio = new Audio(soundFile);
          audio.play().catch((err) => {
            console.warn("Failed to play notification sound:", err);
          });
        } catch (err) {
          console.warn("Failed to create audio:", err);
        }
      }
     
      if (onRfidData) {
        onRfidData(data);
      }
     
      setTimeout(() => setIsPulsing(false), pulseDuration);
    });

    socketRef.current.on("connect", () => {
      setIsOnline(true);
      if (onConnectionChange) {
        onConnectionChange(true);
      }
    });

    socketRef.current.on("disconnect", () => {
      setIsOnline(false);
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsOnline(false);
      setRfidData({
        type: "",
        data: "",
      });
      setIsPulsing(false);
    };
  }, [enabled]);

  return {
    rfidData,
    isOnline,
    isPulsing,
    setRfidData,
    socket: socketRef.current,
  };
}
