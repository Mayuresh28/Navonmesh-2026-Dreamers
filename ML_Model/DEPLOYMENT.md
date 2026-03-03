# 🚀 Quick Deployment Guide

## For Local Development

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate data and train all models
python setup_all.py

# 3. Start the API
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. Test in another terminal
cd ..
python test_api.py
```

Visit http://localhost:8000/docs for interactive API documentation.

## For Render Deployment

### Prerequisites
- All 6 model `.pkl` files must be trained and committed to git
- DO NOT ignore `*.pkl` files in `.gitignore`

### Steps

1. **Train models locally first:**
   ```bash
   python setup_all.py
   ```

2. **Commit model files:**
   ```bash
   git add ECG/ECG_model.pkl
   git add EEG/EEG_model.pkl
   git add EMG/EMG_model.pkl
   git add heart/heart_model.pkl
   git add diabetes/diabetes_model.pkl
   git add stroke/stroke_model.pkl
   git add -A
   git commit -m "Add trained ML models for deployment"
   git push
   ```

3. **Deploy on Render:**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Render auto-detects `render.yaml`
   - Click "Create Web Service"

4. **Wait for deployment** (2-5 minutes)

5. **Test your deployed API:**
   - Visit `https://your-app-name.onrender.com/health`
   - Check `/docs` for interactive API docs

### Render Configuration (auto from render.yaml)
- **Build**: `pip install -r requirements.txt`
- **Start**: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health**: `/health`

## Testing Deployed API

Update `test_api.py` line 8:
```python
API_URL = "https://your-app-name.onrender.com"
```

Then run:
```bash
python test_api.py
```

## Common Issues

❌ **"Models not found"**
- Ensure all `.pkl` files are committed to git
- Check that `.gitignore` doesn't exclude `*.pkl`

❌ **"ImportError: No module named..."**
- Verify all dependencies in `requirements.txt`
- Check Python version (3.11 recommended)

❌ **"404 on /predict"**
- Ensure `cd api` in start command
- Check API is running from correct directory

## Production Checklist

- ✅ All 6 models trained
- ✅ Models committed to git
- ✅ `requirements.txt` up to date
- ✅ `render.yaml` configured correctly
- ✅ Local tests pass
- ✅ Health endpoint returns 200
- ✅ Prediction endpoint works

---

**Need help?** Check `README.md` for detailed documentation.
