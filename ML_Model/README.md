# 🏥 Dhanvantari ML API - Deployment Guide

## Overview
Comprehensive health risk prediction API using 6 ML models:
- **Heart Disease** - Cardiovascular risk assessment
- **Diabetes** - Blood sugar and metabolic risk
- **Stroke** - Cerebrovascular risk analysis
- **ECG** - Heart rhythm abnormality detection
- **EEG** - Brain activity pattern analysis
- **EMG** - Muscle activity assessment

## 🚀 Quick Start

### 1. Setup & Train Models Locally

```bash
# Navigate to ML_Model directory
cd ML_Model

# Install dependencies
pip install -r requirements.txt

# Run complete setup (generates data + trains all models)
python setup_all.py
```

This will:
- Generate synthetic training data for all 6 models
- Train all models with optimal hyperparameters
- Save model files (*.pkl) in respective directories

### 2. Test API Locally

```bash
# Start the API server
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Predict Endpoint**: http://localhost:8000/predict (POST)

### 3. Test Prediction

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "BP": 140,
    "HeartRate": 85,
    "Glucose": 180,
    "SpO2": 96,
    "Sleep": 6,
    "Steps": 5000,
    "hrv_sdnn": 45,
    "stress_ratio": 0.7,
    "emg_rms": 0.6
  }'
```

## 📦 Deploy to Render

### Option 1: Automatic Deployment (Recommended)

1. **Connect Repository to Render**
   - Go to https://render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub repo
   - Render will automatically detect `render.yaml`

2. **Deploy**
   - Render will run: `pip install -r requirements.txt`
   - Then start: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health check at `/health` endpoint

3. **Important**: Commit trained models
   ```bash
   # Make sure model files are committed
   git add ECG/ECG_model.pkl
   git add EEG/EEG_model.pkl
   git add EMG/EMG_model.pkl
   git add heart/heart_model.pkl
   git add diabetes/diabetes_model.pkl
   git add stroke/stroke_model.pkl
   git commit -m "Add trained ML models"
   git push
   ```

### Option 2: Manual Render Setup

1. Create new **Web Service** on Render
2. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: Leave empty or set to `ML_Model`
   - **Environment**: Python 3.11
   - **Health Check Path**: `/health`

## 🏗️ Project Structure

```
ML_Model/
├── api/
│   ├── main.py              # FastAPI application
│   └── __init__.py
├── data/
│   ├── data/                # Generated datasets
│   └── synthetic/           # Data generation scripts
├── utils/
│   ├── preprocessing.py     # Feature engineering functions
│   └── preprocessing_diabetes.py
├── ECG/
│   ├── train_ecg.py         # Training script
│   └── ECG_model.pkl        # Trained model (after setup)
├── EEG/
│   ├── train_eeg.py
│   └── EEG_model.pkl
├── EMG/
│   ├── train_emg.py
│   └── EMG_model.pkl
├── heart/
│   ├── train_heart.py
│   └── heart_model.pkl
├── diabetes/
│   ├── train_diabetes.py
│   └── diabetes_model.pkl
├── stroke/
│   ├── train_stroke.py
│   └── stroke_model.pkl
├── setup_all.py             # Complete setup script
├── requirements.txt         # Python dependencies
└── render.yaml             # Render deployment config
```

## 🔌 API Endpoints

### `GET /`
Health info and available endpoints

### `GET /health`
Service health check
```json
{
  "status": "healthy",
  "models_loaded": 6,
  "models": {
    "heart": "✅",
    "diabetes": "✅",
    "stroke": "✅",
    "ecg": "✅",
    "eeg": "✅",
    "emg": "✅"
  }
}
```

### `POST /predict`
Make health risk predictions

**Request Body:**
```json
{
  "BP": 140.0,
  "HeartRate": 85.0,
  "Glucose": 180.0,
  "SpO2": 96.0,
  "Sleep": 6.0,
  "Steps": 5000.0,
  "hrv_sdnn": 45.0,        // Optional
  "stress_ratio": 0.7,     // Optional
  "emg_rms": 0.6          // Optional
}
```

**Response:**
```json
{
  "heart": {
    "probability": 0.65,
    "risk": 1,
    "status": "High Risk"
  },
  "diabetes": {
    "probability": 0.72,
    "risk": 1,
    "status": "High Risk"
  },
  "stroke": {
    "probability": 0.58,
    "risk": 1,
    "status": "High Risk"
  },
  "ecg": {
    "probability": 0.45,
    "risk": 0,
    "status": "Normal"
  },
  "eeg": {
    "probability": 0.55,
    "risk": 1,
    "status": "Abnormal"
  },
  "emg": {
    "probability": 0.42,
    "risk": 0,
    "status": "Normal"
  },
  "overall_risk": "MODERATE",
  "risk_score": 0.56
}
```

## 🧪 Manual Training (Individual Models)

If you need to retrain specific models:

```bash
# Train individual models
python ECG/train_ecg.py
python EEG/train_eeg.py
python EMG/train_emg.py
python heart/train_heart.py
python diabetes/train_diabetes.py
python stroke/train_stroke.py
```

## 📊 Model Details

| Model | Algorithm | Features | Threshold |
|-------|-----------|----------|-----------|
| Heart | XGBoost + Calibration | BP, HR, Glucose, SpO2, Sleep, Steps + engineered | Optimized |
| Diabetes | XGBoost + Calibration | Same + BMI-related features | Optimized |
| Stroke | GradientBoosting + Calibration | Same + oxygen deficit | Optimized |
| ECG | GradientBoosting + Calibration | heart_rate, hrv_sdnn | 0.5 |
| EEG | GradientBoosting + Calibration | stress_ratio, sleep_hours | 0.5 |
| EMG | XGBoost + Calibration | emg_rms, activity_level | 0.5 |

## 🔧 Troubleshooting

### Models not loading
- Ensure all `.pkl` files exist in model directories
- Run `python setup_all.py` to generate and train

### Import errors
- Check Python version (3.11 recommended)
- Run `pip install -r requirements.txt`

### Render deployment fails
- Verify `render.yaml` configuration
- Check build logs for specific errors
- Ensure model files are committed to git

## 🌐 Environment Variables (Optional)

None required for basic deployment. All models run locally.

## 📝 License

Part of the Dhanvantari Health Monitoring System

## 🤝 Support

For issues or questions, check the deployment logs or contact the development team.
