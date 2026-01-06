import { userServiceApi } from '../../api/api';

/**
 * WebSocket Service for managing real-time connections
 * Handles connection, reconnection, and message handling
 */

export type WebSocketMessage = {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp?: string;
};

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export interface NotificationUrlResponse {
  statusCode: number;
  statusCodeValue: string;
  statusMessage: string;
  data: {
    webSocketUrl: string;
  };
}

export const getNotificationConnectionUrl =
  async (): Promise<NotificationUrlResponse> => {
    try {
      const { data } = await userServiceApi.get<NotificationUrlResponse>(
        '/api/notifications/getConnectionUrl'
      );

      return data;
    } catch (error) {
      console.error('Error fetching notification connection URL:', error);
      throw error;
    }
  };

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private onConnectionChange: ((isConnected: boolean) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onRefreshUrl: (() => Promise<string | null>) | null = null;
  private isManualClose = false;
  private lastUrlRefreshAt: number | null = null;
  private urlRefreshCooldownMs = 60000;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private keepAlivePeriodMs = 25000;
  private readonly subprotocol =
    (import.meta as unknown as { env?: Record<string, string> })?.env
      ?.VITE_WEBSOCKET_SUBPROTOCOL || 'json.webpubsub.azure.v1';

  /**
   * Initialize WebSocket connection
   */
  connect(
    websocketUrl: string,
    onConnectionChange?: (isConnected: boolean) => void,
    onError?: (error: string) => void,
    onRefreshUrl?: () => Promise<string | null>
  ): void {
    // Don't connect if already connected or connecting
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('⏳ WebSocket already connecting...');
      return;
    }

    this.url = websocketUrl;
    this.onConnectionChange = onConnectionChange || null;
    this.onError = onError || null;
    this.onRefreshUrl = onRefreshUrl || null;
    this.isManualClose = false;

    try {
      console.log('📡 Connecting to WebSocket...');
      this.ws = new WebSocket(websocketUrl, this.subprotocol);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = (e) => this.handleClose(e);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleError(error as Event);
    }
  }

  /**
   * Handle WebSocket connection open
   */
  private handleOpen(): void {
    console.log('✅ WebSocket connected');
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    this.keepAliveInterval = setInterval(() => {
      try {
        this.send({ type: 'ping', data: 'keepalive' });
      } catch {
        /* noop */
      }
    }, this.keepAlivePeriodMs);
    this.onConnectionChange?.(true);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', message);

      // Notify all handlers for this message type
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => handler(message));
      }

      // Also notify wildcard handlers (listening to all messages)
      const wildcardHandlers = this.eventHandlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach((handler) => handler(message));
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    const errorMessage = 'WebSocket connection error';
    this.onError?.(errorMessage);
  }

  /**
   * Handle WebSocket connection close
   */
  private async handleClose(event: CloseEvent): Promise<void> {
    console.log('❌ WebSocket disconnected', {
      code: event.code,
      reason: event.reason || 'No reason provided',
      wasClean: event.wasClean,
    });
    this.onConnectionChange?.(false);
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    // Attempt to reconnect if not manually closed
    if (
      !this.isManualClose &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );

      this.reconnectTimeout = setTimeout(
        async () => {
          // Always try to refresh URL on reconnection (tokens may have expired)
          // Only skip if we're in cooldown period
          if (this.onRefreshUrl) {
            const now = Date.now();
            const timeSinceLastRefresh = this.lastUrlRefreshAt
              ? now - this.lastUrlRefreshAt
              : Infinity;

            if (timeSinceLastRefresh >= this.urlRefreshCooldownMs) {
              try {
                const newUrl = await this.onRefreshUrl();
                if (newUrl) {
                  this.url = newUrl;
                  this.lastUrlRefreshAt = now;
                }
              } catch (error) {
                console.error('Error fetching new WebSocket URL:', error);
              }
            } else {
              const remainingSeconds = Math.ceil(
                (this.urlRefreshCooldownMs - timeSinceLastRefresh) / 1000
              );
              console.log(
                `⏳ Skipping URL refresh (cooldown: ${remainingSeconds}s remaining)`
              );
            }
          }

          // Reconnect with the URL (either new or existing)
          if (this.url) {
            this.connect(
              this.url,
              this.onConnectionChange || undefined,
              this.onError || undefined,
              this.onRefreshUrl || undefined
            );
          }
        },
        this.reconnectDelay * this.reconnectAttempts +
          Math.floor(Math.random() * 500)
      );
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.onError?.('Failed to reconnect after multiple attempts');
    }
  }

  /**
   * Subscribe to specific message types
   */
  on(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.off(eventType, handler);
    };
  }

  /**
   * Unsubscribe from specific message types
   */
  off(eventType: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }

  /**
   * Send message through WebSocket
   */
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    this.isManualClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
    this.onConnectionChange?.(false);
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current WebSocket instance
   */
  getWebSocket(): WebSocket | null {
    return this.ws;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
