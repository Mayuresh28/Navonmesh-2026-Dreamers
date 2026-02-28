# धन्वंतरी (Dhanvantari)

###Login Credentials : 

##Username : test@dhanvantari.dev
##Password : test1234

## Preventive Health Monitoring & Early Risk Detection Platform

> Built for **Navonmesh Hackathon 2026** — addressing the growing need for continuous preventive health monitoring and early risk detection in India.

---

## Overview

Dhanvantari is a full-stack health-tech platform that combines a modern web frontend with multiple machine learning backends to deliver:

- **Static Health Risk Assessment** — Profile-based chronic disease risk prediction using Random Forest
- **Dynamic Health Data Analysis** — Real-time biosignal monitoring with formula-based risk scoring
- **NCM (Neuro-Cardio-Muscular) Analysis** — Advanced biosignal fusion using Gradient Boosting models on ECG, EEG, and EMG data

The system is designed to be **proactive rather than reactive**, enabling early identification of health risks before they escalate into critical conditions.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Next.js Frontend (v16)                      │
│    React 19 · Tailwind 4 · Framer Motion · Firebase Auth     │
├──────────┬──────────────┬────────────────┬───────────────────┤
│ Landing  │  Dashboard   │  Dynamic       │  NCM Analysis     │
│ Auth     │  Profile     │  Health Data   │  Biosignal Page   │
│ Pages    │  Results     │  Upload / Sync │                   │
├──────────┴──────────┬───┴────────────────┴───────────────────┤
│                     │  Next.js API Routes                     │
│  /api/profile       │  /api/health-analyze                    │
│  /api/predict       │  /api/ncm-analyze                      │
├─────────────────────┼────────────────────────────────────────┤
│     MongoDB Atlas   │  Python ML Backends                     │
│  ┌──────────────┐   │  ┌────────────────┐  ┌──────────────┐ │
│  │user_profiles │   │  │ Flask :5000    │  │ FastAPI :8000│ │
│  │dynamic_data  │   │  │ Static Risk   │  │ NCM Predict  │ │
│  └──────────────┘   │  │ (RandomForest)│  │ (GBM Models) │ │
│                     │  └────────────────┘  └──────────────┘ │
└─────────────────────┴────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 (inline theme) |
| Animation | Framer Motion 12 |
| Icons | Lucide React + custom SVGs |
| Authentication | Firebase Authentication |
| Database | MongoDB Atlas |
| Static Risk ML | Flask + scikit-learn (RandomForest with SMOTE) |
| NCM Biosignal ML | FastAPI + scikit-learn (GradientBoosting) |
| Data Generation | NeuroKit2, SciPy, NumPy |
| Languages | TypeScript (frontend), Python (ML backends) |

---

## Project Structure

```
navonmesh/
├── web/frontend/my-app/        # Next.js 16 application
│   ├── app/
│   │   ├── page.tsx            # Animated landing page
│   │   ├── layout.tsx          # Root layout with AuthProvider
│   │   ├── globals.css         # Tailwind v4 theme & design system
│   │   ├── auth/
│   │   │   ├── sign-in/        # Firebase email/password sign-in
│   │   │   └── sign-up/        # Registration with validation
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Dashboard hub with quick stats
│   │   │   ├── profile/        # View + edit health profile
│   │   │   ├── results/        # Static risk assessment results
│   │   │   └── ncm-analysis/   # NCM biosignal analysis UI
│   │   ├── dynamic/
│   │   │   ├── page.tsx        # CSV upload & auto-sync dashboard
│   │   │   └── healthEngine.ts # Client-side formula-based risk engine
│   │   └── api/
│   │       ├── profile/        # CRUD for user profiles (MongoDB)
│   │       ├── predict/        # Proxy to Flask static risk model
│   │       ├── health-analyze/ # Process & store dynamic health data
│   │       └── ncm-analyze/    # NCM ML prediction with fallback
│   └── lib/
│       ├── auth-context.tsx    # Firebase auth React Context
│       ├── firebase.ts         # Firebase initialization
│       ├── mongodb.ts          # MongoDB connection + CRUD helpers
│       ├── navbar.tsx          # Responsive top/bottom navigation
│       ├── profile-hook.ts     # useProfileData() hook
│       ├── protected-route.tsx # Auth guard component
│       └── glassmorphic-bg.tsx # Animated background blobs
│
├── ml/static/                  # Static risk prediction backend
│   ├── app.py                  # Flask server (port 5000)
│   ├── dhanvantari_static_model.ipynb  # Model training notebook
│   ├── requirements.txt
│   └── static_health_risk_dataset_5000_rows.csv
│
├── ML_Model/                   # NCM biosignal ML backend
│   ├── ncm_api.py              # FastAPI server (port 8000)
│   ├── ncm_full_system.py      # GBM training pipeline
│   ├── generate_ncm_dataset.py # Synthetic biosignal data generator
│   ├── ECG_Prediction.ipynb    # ECG Foundation Model exploration
│   └── synthetic_ncm_dataset.csv
│
├── sample_data/                # Sample CSV files for testing
│   ├── blood_pressure.csv
│   ├── ecg.csv, eeg.csv, emg.csv
│   ├── glucose.csv, heart_rate.csv
│   └── spo2.csv
│
└── README.md
```

---

## Features

### 1. User Authentication & Profile Management
- Firebase email/password authentication with protected routes
- Comprehensive health profile: age, gender, height, weight, smoking, alcohol, family history, medical conditions
- **Auto-computed derived fields**: BMI, Genetic Risk Score (weighted: family history 0.4 + smoking 0.3 + alcohol 0.3), Age Risk Multiplier

### 2. Static Health Risk Assessment
- **Model**: Random Forest classifier trained on 5,000 samples with SMOTE oversampling
- **Input**: 4 base features (BMI, Genetic Risk, Age Risk Multiplier, Baseline Risk)
- **Engineered Features**: Composite Risk, BMI × Genetic interaction, Age × Baseline interaction
- **Output**: Risk class (Low / Moderate / High) with per-class probability scores
- Comprehensive profile validation before inference; only runs when all required fields are present

### 3. Dynamic Health Data Dashboard
- **Manual Upload**: CSV files for blood pressure, heart rate, glucose, SpO2, sleep, steps, EEG, EMG, ECG
- **Auto Sync**: Merges all historical entries from MongoDB for cumulative analysis
- **Client-side Health Engine** (`healthEngine.ts`): pure-math analysis with no server round-trip
  - Statistical: mean, linear regression slope (OLS), percent change, variance
  - Instability index and trend-aware risk scoring
  - Clinical thresholds for 9 health parameters

### 4. NCM (Neuro-Cardio-Muscular) Analysis
- **Biosignal Fusion**: Combines ECG (40%), EEG (35%), EMG (25%) into an NCM index (0-100)
- **ML Models**: Three separate GradientBoosting classifiers for cardiac risk, stress detection, and fatigue assessment
- **Feature Extraction**: HRV SDNN from R-R intervals, beta/alpha stress ratio via Welch PSD, EMG RMS
- **Graceful Degradation**: Falls back to formula-based computation when the Python API is unreachable
- **Visualization**: Animated circular gauge, signal cards with risk bars, clinical interpretation banner

### 5. UI/UX
- Mobile-first responsive design with desktop top-bar and mobile bottom navigation
- Pastel light theme enforced via a comprehensive design system (8px grid, 20-24px radius, soft shadows)
- Framer Motion animations throughout: staggered cards, page transitions, SVG gauge animations
- Glassmorphic animated background with floating translucent blobs

---

## Data Flow

```
User Signs Up → Firebase Auth → Profile Setup Form
  → POST /api/profile → MongoDB user_profiles (+ auto-computed derived fields)

User Uploads CSV → Client parses → POST /api/health-analyze
  → healthEngine.processAllParameters() → MongoDB dynamic_data → Results UI

Auto Sync → GET /api/health-analyze → Merge ALL dynamic_data entries
  → Re-analyze combined dataset → Cumulative Results UI

Risk Assessment → Profile data → model input mapping
  → POST /api/predict → Flask /predict (RandomForest) → Results page

NCM Analysis → GET /api/ncm-analyze → Fetch ECG/EEG/EMG from MongoDB
  → Try FastAPI /predict-raw (GBM models)
  → Fallback: formula-based NCM computation → NCM Analysis page
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account (or local MongoDB)
- Firebase project

### 1. Frontend Setup

```bash
cd web/frontend/my-app
npm install
```

Create a `.env.local` with your Firebase and MongoDB credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
MONGODB_URI=...
```

```bash
npm run dev        # Starts on http://localhost:3000
```

### 2. Static Risk ML Backend

```bash
cd ml/static
pip install -r requirements.txt
python app.py      # Starts Flask on http://localhost:5000
```

### 3. NCM Biosignal ML Backend

```bash
cd ML_Model
pip install fastapi uvicorn scikit-learn numpy scipy neurokit2 joblib
# Train models first (if .pkl files don't exist):
python ncm_full_system.py
# Then start the API:
python ncm_api.py  # Starts FastAPI on http://localhost:8000
```

> **Note**: The NCM analysis page works even without the Python backend — it falls back to formula-based computation automatically.

---

## Key Architecture Decisions

1. **Dual ML Pipeline** — Static risk (profile-based, Flask) and Dynamic NCM (biosignal-based, FastAPI) address different health domains independently
2. **Graceful ML Degradation** — NCM analysis falls back to formula-based computation when the Python API is unreachable; the app never breaks
3. **Client-side Health Engine** — `healthEngine.ts` runs pure math (mean, OLS slope, variance, risk scoring) directly in the browser with zero server dependency
4. **Server-side Derived Fields** — MongoDB helpers automatically recompute BMI, Genetic Risk Score, and Age Risk Multiplier on every profile create/update
5. **Weighted Risk Fusion** — NCM Index uses clinical weighting (ECG 40%, EEG 35%, EMG 25%); Composite Risk uses `BMI×0.3 + GR×0.3 + ARM×0.2 + BR×0.2`
6. **Data Accumulation** — The GET endpoint for health-analyze merges ALL historical entries so analysis improves as more data is uploaded
7. **Profile-Gated Access** — Dashboard auto-redirects first-time users to profile setup; Results page validates profile completeness before running ML

---

## Problem Statement

India is experiencing a significant rise in lifestyle-related and chronic conditions (cardiovascular diseases, diabetes, hypertension, respiratory disorders). A large percentage remain undiagnosed until advanced stages due to limited routine monitoring, low preventive awareness, and accessibility barriers.

### Key Challenges Addressed
- Absence of real-time or continuous health parameter tracking at scale
- Limited early identification of high-risk individuals
- Fragmented personal health data across providers
- Lack of actionable insights for preventive intervention
- Digital divide across linguistic and socio-economic groups

### Expected Impact
- Reduce late-stage diagnosis of chronic diseases
- Enable early risk stratification through ML models
- Improve preventive healthcare awareness
- Reduce long-term healthcare costs
- Support public health decision-making through data-driven insights

---

## Sample Data

The `sample_data/` directory contains CSV files for testing the dynamic health dashboard: blood pressure, heart rate, glucose, SpO2, ECG, EEG, and EMG signals.

---

## License

Built for Navonmesh Hackathon 2026.
