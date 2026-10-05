# FuelTrust — Smart Fuel Verification & Vehicle Efficiency Monitoring

> **Smart Fuel Verification & Vehicle Efficiency Monitoring Platform**  
> *Independent fuel quantity auditing, dispenser verification, and fleet efficiency analytics.*

---

## 🎯 Project Overview

**FuelTrust** is a smart fuel verification and vehicle efficiency monitoring platform designed to monitor fuel quantity, support fuel dispensing verification, and provide vehicle fuel-efficiency analytics. By comparing fuel quantities reported by commercial fuel dispensers against independent measurement telemetry, the platform calculates volumetric differences, evaluates percentage deviations, and verifies compliance against configurable metrological tolerance thresholds.

### Core Verification Architecture

```
Dispenser Reported Quantity (Q_disp)
                 +
FuelTrust Independent Measurement (Q_meas)
                 ↓
      Difference Calculation (Δ = Q_disp - Q_meas)
                 ↓
      Percentage Deviation (|Δ| / Q_disp × 100)
                 ↓
          Verification Engine
                 ↓
       [ VERIFIED / REVIEW ]
                 ↓
      Refuelling Record & Telemetry Ingest
                 ↓
      Data Analysis & Fleet Efficiency Analytics
```

---

## ✨ Key Features

- **Independent Fuel Verification**: Real-time evaluation of dispenser quantities against in-line sensor volumetric streams with configurable tolerance bands (default $\pm 2.0\%$).
- **Live Flow Telemetry Console**: Continuous monitoring of instantaneous flow rate (L/min), accumulated volume, line pressure, temperature, and pulse interrupts.
- **Sensor Calibration & Proving**: Meter calibration engine computing volumetric error, percentage error, and meter correction factor $K$.
- **Data Analysis & Fleet Insights**: Interactive charts for fuel volume over time, sequential deviation tracking, fuel economy trends (km/L), and station discrepancy rankings.
- **Fleet Vehicle Registry**: Monitored fleet asset tracking, fuel grades, tank capacities, and individual vehicle audit profiles.
- **Comprehensive Audit Log**: Searchable, filterable refuelling history with multi-parameter filtering and CSV data export.
- **Hardware Abstraction Layer**: Decoupled data source interface designed for flexible physical ESP32 microcontroller and flow turbine integration.

---

## 🏗️ System Architecture

FuelTrust is architected with a decoupled frontend, backend verification service, and hardware abstraction layer:

```
[ Flow Turbine Sensor (YF-S201) ]   ──►   [ ESP32 Microcontroller Node ]
                                                        │
                                                        ▼ (WiFi / REST / Serial)
                                            [ Data Source Interface ]
                                                        │
                                                        ▼
                                            [ Verification Engine (FastAPI) ]
                                                        │
                                                        ▼
                                            [ SQLite Database Engine ]
                                                        │
                                                        ▼
                                            [ React + TypeScript Dashboard ]
```

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS & Tailwind CSS (White Glassmorphism UI Theme)
- **Data Visualization**: Recharts (Area, Line, Pie, Bar charts)
- **Icons**: Lucide React
- **Typography**: Poppins & JetBrains Mono

### Backend
- **Framework**: Python 3.10+ / FastAPI
- **ORM & Database**: SQLAlchemy with SQLite
- **Validation**: Pydantic v2
- **Server**: Uvicorn ASGI

---

## 📱 Application Modules

1. **Dashboard**: High-level KPI summary cards (Total Fuel Purchased, Audited Events, Verification Rate, Mean Deviation, Average Mileage) and Latest Verification audit comparison.
2. **Live Measurement**: Real-time fluid dynamics console with flow rate hydro-dynamics graph, session timer, pressure/temperature gauges, and verification handoff.
3. **Sensor Calibration**: Prover proving interface calculating volumetric error and correction factor multiplier $K = Q_{ref} / Q_{meas}$.
4. **Refuelling Verification**: 5-step verification workflow with input validation, calculation breakdown, tolerance envelope meter, and preset profiles.
5. **Data Analysis**: Dynamic analytics suite featuring Fuel Volume Over Time, Deviation Over Time ($\pm 2.0\%$ limit line), Mileage Trends, Verification Status Distribution, and Station/Vehicle Discrepancy rankings.
6. **Vehicles Fleet**: Fleet asset management supporting vehicle addition, edits, odometer tracking, and default assignment.
7. **Refuelling History**: Audit history table with multi-filter search, status chips, detailed modal inspection, and CSV report export.
8. **Hardware & Telemetry**: Microcontroller diagnostic status, bus telemetry, and pulse interrupt monitoring.
9. **Settings**: Configurable verification tolerance thresholds, high discrepancy alert triggers, units of measure, and receiver bridge modes.

---

## 🔌 Hardware Integration Architecture

The software architecture is engineered to receive measurement data from future fuel measurement hardware and ESP32 microcontroller integrations.

### Hardware Pipeline:
1. **Flow Sensor**: YF-S201 Hall-effect turbine sensor measuring volumetric pulse interrupts ($F = 7.5 \times Q$).
2. **Microcontroller**: ESP32 dual-core processor capturing interrupt counts and environmental sensors (DS18B20 temperature, line pressure, GPS).
3. **Ingest Bridge**: RESTful JSON webhook endpoints (`/api/device/live`, `/api/device/history`) and Serial UART bridges.
4. **Data Source Abstraction**: `BaseFuelDataSource` interface ensuring business logic remains independent of physical hardware connectivity.

---

## 🚀 Installation & Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Documentation: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

- Open browser to: `http://localhost:5173/`

---

## 📂 Project Structure

```
Fuel Trust/
├── .gitignore                      # Git ignore rules for node_modules, build, databases
├── README.md                       # Platform documentation
├── backend/
│   ├── requirements.txt            # Python dependencies
│   ├── tests/
│   │   └── test_fueltrust.py       # Unit test suite
│   └── app/
│       ├── main.py                 # FastAPI app entrypoint
│       ├── database.py             # Database engine & session setup
│       ├── seed_data.py            # Historical dataset seeder
│       ├── models/                 # SQLAlchemy database models
│       ├── schemas/                # Pydantic schema validation
│       ├── services/
│       │   ├── data_source/        # Decoupled hardware data source layer
│       │   ├── verification_engine.py  # Verification computation logic
│       │   ├── calibration_service.py  # Metrology proving logic
│       │   ├── measurement_service.py  # Live flow telemetry service
│       │   └── analytics_service.py    # Discrepancy & mileage analytics
│       └── routers/                # REST API routers
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── types.ts                # TypeScript domain models
        ├── services/api.ts         # Axios HTTP client service
        ├── components/             # Reusable UI components & modals
        └── screens/                # Core platform screens
```

---

## 🧪 Scientific Neutrality Standard

FuelTrust adheres to objective metrology principles:
- **`VERIFIED`**: Dispenser quantity matches sensor measurement within the configured tolerance threshold.
- **`REVIEW`**: Volumetric discrepancy exceeds the allowable threshold, warranting physical calibration or meter inspection.

---

## 🔮 Future Enhancements

- Production ESP32 firmware integration with secure MQTT/TLS telemetry transport.
- Multi-compartment fuel tanker monitoring.
- Automated sensor thermal expansion coefficient compensation ($V_{t} = V_0 [1 + \beta(T - T_0)]$).
- Mobile driver companion application for on-site refuelling verification receipt scanning.
