import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { logMessage } from "../utils/helpers";

class WebSocketManager {
  private static instance: WebSocketManager;
  private io: SocketIOServer | null = null;

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*", // Configure this to match your frontend URL in production
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupEventHandlers();
    logMessage("WebSocket server initialized");
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket) => {
      logMessage(`Client connected: ${socket.id}`);

      socket.on("join-assessment", (data) => {
        const { company_id, project_id } = data;
        const roomName = `assessment_${company_id}_${project_id}`;
        socket.join(roomName);
        logMessage(`Client ${socket.id} joined room: ${roomName}`);
      });

      socket.on("disconnect", () => {
        logMessage(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Send message to specific room based on company_id and project_id
  sendToAssessmentRoom(transaction_id: string, message: any): void {
    if (!this.io) {
      logMessage("WebSocket server not initialized");
      return;
    }
   const rawSummary = message.data.updated_summary;

  // ✅ Ensure project_summary is stringified ONCE
  const project_summary =
    typeof rawSummary === "string"
      ? rawSummary
      : JSON.stringify(rawSummary);

    const roomName = `assessment_${transaction_id}`;
    this.io.to(roomName).emit("ai-response", project_summary);
    logMessage(`Message sent to room ${roomName}: ${JSON.stringify(message)}`);
  }

 

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export default WebSocketManager;