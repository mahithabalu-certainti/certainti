import { AlertColor } from "@mui/material";

export interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}