# NAKSHA-AI: AI-Assisted Cadastral Fabric Builder & Verification-Priority Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Desktop-2496ED.svg?style=flat&logo=docker)](https://www.docker.com)
[![SIH 2026](https://img.shields.io/badge/SIH%202026-PS%2026012-orange.svg)](https://sih.gov.in)
[![DoLR DILRMP](https://img.shields.io/badge/DoLR-DILRMP-blue.svg)](https://dolr.gov.in)

> **"NAKSHA-AI is an explainable, human-in-the-loop cadastral AI that doesn’t just draw boundaries — it tells DoLR exactly which parcels are trustworthy, which are in dispute, and which need a surveyor on the ground first."**

---

## 🏛️ Executive Summary & The Novel Angle

Most computer vision cadastral approaches simply run segmentation on drone imagery and draw polygons on a map. However, an AI model that is 90% accurate is unusable for legal land records unless authorities know **which 10–15% of boundaries to inspect**. 

**NAKSHA-AI converts this limitation into its core strength through an automated Triage & Verification-Priority Engine:**
1. **Fuses AI Boundaries with Legacy Records & CORS GNSS Ground Truth**: Computes real geodetic IoU and Hausdorff distance against legacy revenue records (Jamabandi / Khasra maps).
2. **Prioritizes Discrepancies (0–100 Verification Priority Score)**: Evaluates legacy conflict severity, model uncertainty, Survey of India CORS ground control residuals, and land-use ambiguity.
3. **Reduces Field Survey Load by ~88%**: Instead of resurveying 100% of an urban area, ground survey teams are dispatched only to the ~12% of parcels with critical, unresolved disputes.
4. **Enforces Immutable Auditing**: Every human alteration, one-click GNSS snap, and approval is cryptographically chained and signed.

---

## 🌟 Key Features

### 1. Interactive Web-GIS Cadastral Map
- **High-Contrast Calm Dark Aesthetic**: Tailored for prolonged surveyor inspection sessions with crisp visibility of boundary divergence.
- **Priority-Coded Polygons**:
  - 🔴 **Critical (85–100)**: Severe conflict / immediate field ground visit needed.
  - 🟠 **High (60–84)**: Notable boundary divergence.
  - 🟡 **Moderate (30–59)**: Minor variance / desk review.
  - 🟢 **Low (0–29)**: Concordant, trustworthy / automated approval.
- **Layer Controls**:
  - AI Proposed / Approved Boundaries (Electric Cyan)
  - Legacy Cadastral Records (Purple Dashed Jamabandi)
  - Survey of India CORS Network Stations (Pulsing Blue Anchor Pins)
  - Access Corridors & Road Networks (Amber Corridors)
  - 3D Building Extrusion (Isometric height delta view)
  - Base Maps: High-contrast Dark Carto and Satellite Orthophoto (ESRI World Imagery)

### 2. Live Verification Priority Queue
- Dynamically ranked by priority score in descending order.
- Search by Khasra number, parcel code, or revenue ward.
- Real-time WebSocket feed (`/ws/live-queue`) pushing queue shifts instantaneously.

### 3. Discrepancy Studio ("WHY FLAGGED?")
- Visual radar breakdown of the 4 component signals:
  $$\text{Priority} = \text{clip}(0.35 \times \text{conflict\_severity} + 0.30 \times \text{seg\_uncertainty} + 0.20 \times \text{gnss\_score} + 0.15 \times \text{landuse\_uncertainty}, 0, 100)$$
- Plain-English legal surveyor recommendation banner.
- **Interactive Vertex Editor**: Drag polygon boundary vertices directly on the map.
- **One-Click CORS Snapping**: Auto-snaps the nearest vertex to the Survey of India CORS anchor within legal tolerance.
- **Surveyor Actions**: *Approve As-Is*, *Approve with Edit*, *Dispatch Ground Team*, *Reject Proposal*.

### 4. Immutable Cadastral Audit Log
- Cryptographically signed audit trail (SHA-256 chained ledger) capturing:
  - Actor name & designation
  - Timestamp (UTC)
  - Action taken
  - Geometry before & geometry after
  - Legal justifications

### 5. Field Verification App (Surveyor Mobile PWA View)
- Simulates on-site smartphone/tablet interface for ground survey teams:
  - Live simulated GPS rover beacon with sub-meter RTK fix.
  - Geotagged camera evidence simulator.
  - One-tap "Confirm & Sync to Cadastre".

### 6. Interactive 10-Step SIH 2026 Evaluator Demo Tour
- A 1-click guided walkthrough implementing the exact demo script from **Section 12 of the build document**, stepping judges through the entire end-to-end triage cycle!

---

## 🏗️ System Architecture

```
naksha/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Application Entrypoint & CORS
│   │   ├── db.py                    # Cadastral DataStore & Spatial Fabric Seed
│   │   ├── models/schemas.py        # Pydantic v2 Models & GeoJSON schemas
│   │   ├── services/
│   │   │   ├── spatial_engine.py    # IoU, Hausdorff, geodetic pyproj, vertex snap
│   │   │   ├── priority_service.py  # Formula 8.4 Fusion Engine & recommendations
│   │   │   └── audit_service.py     # Cryptographic SHA-256 Audit Trail
│   │   └── routers/
│   │       ├── parcels.py           # GET /api/parcels (GeoJSON & details)
│   │       ├── queue.py             # GET /api/queue (Ranked triage queue)
│   │       ├── verify.py            # POST /api/parcels/{id}/verify & snap-gnss
│   │       ├── roads.py             # GET /api/roads & /api/cors
│   │       ├── stats.py             # GET /api/stats (AOI & Triage metrics)
│   │       └── ws.py                # WS /ws/live-queue (Real-time socket)
│   └── tests/
│       └── test_api.py              # Automated test suite (10/10 tests passing)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/CadastralMap.tsx               # Leaflet GIS Map & vertex editing
│   │   │   ├── Queue/VerificationQueue.tsx        # Priority Queue Sidebar
│   │   │   ├── Inspector/ParcelInspectorDrawer.tsx# Discrepancy Studio & Audit Trail
│   │   │   ├── Analytics/StatsOverview.tsx        # Executive Triage Analytics Modal
│   │   │   ├── FieldApp/FieldVerificationModal.tsx# Mobile Surveyor PWA simulation
│   │   │   └── DemoTour/DemoFlowGuide.tsx         # Guided 10-Step Demo Tour
│   │   ├── App.tsx                                # Main App Workspace & Layout
│   │   └── types.ts                               # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── Dockerfile.backend               # Container definition for FastAPI
├── Dockerfile.frontend              # Multi-stage build + Nginx production server
├── docker-compose.yml               # Multi-container orchestration
├── requirements.txt                 # Backend dependencies
├── start_dev.ps1                    # 1-Click Local Dev Launcher
└── start_docker.ps1                 # 1-Click Docker Desktop Launcher
```

---

## 🚀 Quick Start Guide

### Option A: 1-Click Docker Desktop (Recommended for Production / Evaluation)

Ensure Docker Desktop is running, then run:

```powershell
.\start_docker.ps1
```

Or manually:
```bash
docker compose up --build -d
```

Access the interfaces:
- **Web-GIS Application**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Swagger API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Local Development (Installed on D: Drive)

The Python virtual environment and npm/pip caches have been configured on the **D: drive** (`D:\naksha_env` and `D:\naksha_cache`) to preserve your C: drive storage.

To launch both backend and frontend concurrently:

```powershell
.\start_dev.ps1
```

Or individually:

**1. Start Backend:**
```powershell
$env:PYTHONPATH = "."
& D:\naksha_env\Scripts\uvicorn.exe backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

**2. Start Frontend:**
```powershell
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

Run the backend test suite:

```powershell
$env:PYTHONPATH = "."
& D:\naksha_env\Scripts\pytest.exe backend\tests\test_api.py -v
```

All 10 tests verify:
- Root API system status endpoint
- Static SPA frontend distribution serving
- GeoJSON parcel collection schema
- Flagship critical parcel `AOI-0341` divergence parameters
- Priority queue descending order
- Formula 8.4 priority calculation
- Surveyor verify action workflow and cryptographic audit logging
- Automated Survey of India CORS vertex snapping
- Executive triage savings calculations
- Authentic dataset export endpoints and schema validation

---

## 📄 Master Guide & Hackathon Pitch Handbook (PDF)

A 10-page master guide has been generated in the project root:
- **File**: `NAKSHA_AI_Complete_Master_Guide.pdf`
- **Backup Location**: `D:\naksha_data\NAKSHA_AI_Complete_Master_Guide.pdf`
- **Contents**: Real-world problem explanation, Hospital Triage analogy, 7-step cadastral pipeline, Formula 8.4 mathematics, UI features, Authentic datasets, 10-step judge pitch script with exact dialogue, tough Q&A answers, and revenue glossary.

---

## 🎯 10-Step SIH Demo Flow

Click the **"▶ SIH 2026 Demo Flow"** button in the top navigation bar to run through the presentation sequence:
1. **AOI Overview**: View the 3.8 km² Delhi-NCR urban AOI with color-coded priority parcels.
2. **Queue Sidebar**: Point out how critical disputes (85–100 score) automatically surface at the top.
3. **Inspect Parcel AOI-0341**: View the #1 critical parcel showing 6.8m boundary divergence from the 1982 Jamabandi record.
4. **Signal Breakdown**: Review the IoU, Hausdorff, segmentation confidence, and CORS residual metrics.
5. **CORS Snap**: Click "Snap to CORS Point" to auto-anchor the vertex to the Survey of India benchmark.
6. **Approve with Edit**: Submit the official surveyor sign-off with custom legal notes.
7. **Live Sync**: Watch the queue re-sort live over WebSockets as AOI-0341 drops out of the critical band.
8. **Road Corridors**: Toggle access corridors and land-use classifications.
9. **Mobile Field App**: Switch to the on-site surveyor view showing real-time GPS rover positioning and ground confirmation.
10. **The Bottom Line**: Conclude with the executive dashboard showing that **88% of parcels were safely auto-approved and only ~12% required ground teams**.
