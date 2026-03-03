"""
Train all Dhanvantari ML models
Run this script to train all 6 disease prediction models
"""

import os
import sys
import subprocess

print("\n" + "="*60)
print("🏥 DHANVANTARI - TRAINING ALL ML MODELS")
print("="*60 + "\n")

models = [
    ("ECG", "ECG/train_ecg.py"),
    ("EEG", "EEG/train_eeg.py"),
    ("EMG", "EMG/train_emg.py"),
    ("Heart Disease", "heart/train_heart.py"),
    ("Diabetes", "diabetes/train_diabetes.py"),
    ("Stroke", "stroke/train_stroke.py"),
]

trained_count = 0
failed_models = []

for model_name, script_path in models:
    print(f"\n{'─'*60}")
    print(f"🔄 Training {model_name} Model...")
    print(f"{'─'*60}\n")
    
    try:
        # Check if script exists
        if not os.path.exists(script_path):
            print(f"⚠️  Script not found: {script_path}")
            failed_models.append(model_name)
            continue
        
        # Run training script
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            check=True
        )
        
        print(result.stdout)
        if result.stderr:
            print("Warnings:", result.stderr)
        
        print(f"✅ {model_name} model trained successfully!")
        trained_count += 1
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error training {model_name} model:")
        print(e.stdout)
        print(e.stderr)
        failed_models.append(model_name)
    except Exception as e:
        print(f"❌ Unexpected error training {model_name}: {str(e)}")
        failed_models.append(model_name)

# Summary
print("\n" + "="*60)
print("📊 TRAINING SUMMARY")
print("="*60)
print(f"✅ Successfully trained: {trained_count}/{len(models)} models")

if failed_models:
    print(f"❌ Failed models: {', '.join(failed_models)}")
else:
    print("🎉 All models trained successfully!")
    
print("\n" + "="*60 + "\n")
