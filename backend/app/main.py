from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routers import parcels, queue, verify, roads, stats, ws, dataset

app = FastAPI(
    title="NAKSHA-AI API",
    description="AI-Assisted Cadastral Fabric Builder & Verification-Priority Engine (DoLR DILRMP / SIH 2026 PS 26012)",
    version="1.0.0"
)

# Enable CORS for frontend dashboard and mobile field app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(parcels.router)
app.include_router(queue.router)
app.include_router(verify.router)
app.include_router(roads.router)
app.include_router(stats.router)
app.include_router(ws.router)
app.include_router(dataset.router)

@app.get("/api/system")
def system_status():
    return {
        "system": "NAKSHA-AI Cadastral Decision Support Engine",
        "version": "1.0.0",
        "organization": "Department of Land Resources (DoLR), Government of India",
        "status": "operational",
        "endpoints": {
            "parcels_geojson": "/api/parcels",
            "triage_queue": "/api/queue",
            "stats": "/api/stats",
            "roads": "/api/roads",
            "cors_stations": "/api/cors",
            "websocket_live": "/ws/live-queue",
            "docs": "/docs"
        }
    }

# Mount static frontend production build if available
import os
from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dist_path = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

