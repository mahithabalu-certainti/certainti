import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface WebSocketState {
  websocketUrl: string | null;
  isConnected: boolean;
  connectionError: string | null;
}

const initialState: WebSocketState = {
  websocketUrl: null,
  isConnected: false,
  connectionError: null,
};

export const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setWebSocketUrl: (state, action: PayloadAction<string>) => {
      state.websocketUrl = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.connectionError = null;
      }
    },
    setConnectionError: (state, action: PayloadAction<string>) => {
      state.connectionError = action.payload;
      state.isConnected = false;
    },
    clearWebSocketState: () => {
      return initialState;
    },
  },
});

export const {
  setWebSocketUrl,
  setConnectionStatus,
  setConnectionError,
  clearWebSocketState,
} = websocketSlice.actions;
