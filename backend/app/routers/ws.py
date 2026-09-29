import json
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        text_data = json.dumps(message)
        to_remove = []
        for connection in self.active_connections:
            try:
                await connection.send_text(text_data)
            except Exception:
                to_remove.append(connection)
        for conn in to_remove:
            self.disconnect(conn)

ws_manager = ConnectionManager()

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/live-queue")
async def websocket_live_queue(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial confirmation message
        await websocket.send_text(json.dumps({
            "event": "connected",
            "message": "Connected to NAKSHA-AI Real-Time Cadastral Triage Feed"
        }))
        while True:
            # Keep connection alive; accept any client heartbeat
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"event": "pong"}))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
