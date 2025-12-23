import { useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store/store';
import {
  WebSocketEventHandler,
  WebSocketMessage,
  websocketService,
} from '../services/websocket/websocket-service';
import { setConnectionError, setConnectionStatus } from '../store/slices';

/**
 * Custom hook to manage WebSocket connection
 * Automatically connects when websocketUrl is available
 */
export const useWebSocket = () => {
  const dispatch = useAppDispatch();
  const { websocketUrl, isConnected } = useSelector(
    (state: RootState) => state.websocket
  );
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (websocketUrl && !hasInitialized.current) {
      hasInitialized.current = true;

      const handleConnectionChange = (connected: boolean) => {
        dispatch(setConnectionStatus(connected));
      };

      const handleError = (error: string) => {
        dispatch(setConnectionError(error));
      };

      // Connect to WebSocket
      websocketService.connect(
        websocketUrl,
        handleConnectionChange,
        handleError
      );
    }

    // Disconnect when websocketUrl is cleared (on logout)
    if (!websocketUrl && hasInitialized.current) {
      websocketService.disconnect();
      hasInitialized.current = false;
    }

    // Cleanup only when component unmounts or URL changes
    return () => {
      // Don't disconnect if we still have a URL (React Strict Mode double-render)
      // Only disconnect if the URL is being cleared or component is truly unmounting
      if (!websocketUrl && hasInitialized.current) {
        websocketService.disconnect();
        hasInitialized.current = false;
      }
    };
  }, [websocketUrl, dispatch]);

  const subscribe = useCallback(
    (eventType: string, handler: WebSocketEventHandler) => {
      return websocketService.on(eventType, handler);
    },
    []
  );

  const send = useCallback((message: WebSocketMessage) => {
    websocketService.send(message);
  }, []);

  return {
    isConnected,
    subscribe,
    send,
  };
};

/**
 * Custom hook to subscribe to specific WebSocket events
 * @param eventType - The type of event to listen for (use '*' for all events)
 * @param handler - The handler function to call when the event is received
 */
export const useWebSocketEvent = (
  eventType: string,
  handler: WebSocketEventHandler
) => {
  const handlerRef = useRef(handler);

  // Update handler ref when it changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // Wrap handler to use the ref
    const wrappedHandler = (message: WebSocketMessage) => {
      handlerRef.current(message);
    };

    const unsubscribe = websocketService.on(eventType, wrappedHandler);

    return () => {
      unsubscribe();
    };
  }, [eventType]);
};

// Re-export types for convenience
export type { WebSocketMessage, WebSocketEventHandler };
