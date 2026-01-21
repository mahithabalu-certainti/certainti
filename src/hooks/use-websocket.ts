import { useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store/store';
import {
  WebSocketEventHandler,
  WebSocketMessage,
  websocketService,
  getNotificationConnectionUrl,
} from '../services/websocket/websocket-service';
import {
  setConnectionError,
  setConnectionStatus,
  setWebSocketUrl,
} from '../store/slices';

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

  // Callback to fetch new WebSocket URL and token
  const refreshWebSocketUrl = useCallback(async (): Promise<string | null> => {
    console.log('🔄 Fetching new WebSocket connection URL...');
    try {
      const response = await getNotificationConnectionUrl();

      if (response?.data?.webSocketUrl) {
        const websocketBaseUrl = import.meta.env.VITE_WEBSOCKET_URL;
        const newWebsocketUrl = `${websocketBaseUrl}?access_token=${response.data.webSocketUrl}`;

        // Update Redux with new WebSocket URL
        dispatch(setWebSocketUrl(newWebsocketUrl));

        return newWebsocketUrl;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch new WebSocket URL:', error);
      return null;
    }
  }, [dispatch]);

  useEffect(() => {
    if (websocketUrl && !hasInitialized.current) {
      hasInitialized.current = true;

      const handleConnectionChange = (connected: boolean) => {
        dispatch(setConnectionStatus(connected));
      };

      const handleError = (error: string) => {
        dispatch(setConnectionError(error));
      };

      // Connect to WebSocket with refresh URL callback
      websocketService.connect(
        websocketUrl,
        handleConnectionChange,
        handleError,
        refreshWebSocketUrl
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
  }, [websocketUrl, dispatch, refreshWebSocketUrl]);

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
