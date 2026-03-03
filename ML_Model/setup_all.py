"""
Dhanvantari ML Models - Complete Setup Script
==============================================
This script:
1. Generates synthetic training data for all models
2. Trains all 6 ML models (Heart, Diabetes, Stroke, ECG, EEG, EMG)
3. Prepares the models for deployment

Run this before deploying to Render or running the API locally.
"""

import os
import sys
import subprocess

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def run_command(command, description):
    """Run a shell command and print status"""
    print(f"\n{'─'*60}")
    print(f"🔄 {description}")
    print(f"{'─'*60}\n")
    
    try:
        # Set environment for subprocess to handle UTF-8
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            check=True,
            env=env,
            encoding='utf-8'
        )
        print(result.stdout)
        if result.stderr:
            print("Warnings:", result.stderr)
        print(f"✅ {description} - DONE")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error in {description}:")
        print(e.stdout)
        print(e.stderr)
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def main():
    print("\n" + "="*60)
    print("🏥 DHANVANTARI ML MODELS - COMPLETE SETUP")
    print("="*60 + "\n")
    
    # Step 1: Generate Synthetic Data
    print("\n" + "="*60)
    print("📊 STEP 1: GENERATING SYNTHETIC DATA")
    print("="*60)
    
    data_generators = [
        ("python data/synthetic/generate_heart_data.py", "Heart Data"),
        ("python data/synthetic/generate_diabetes_data.py", "Diabetes Data"),
        ("python data/synthetic/generate_stroke_data.py", "Stroke Data"),
        ("python data/synthetic/generate_ecg_dataset.py", "ECG Data"),
        ("python data/synthetic/generate_eeg_dataset.py", "EEG Data"),
        ("python data/synthetic/generate_emg_dataset.py", "EMG Data"),
    ]
    
    data_success = 0
    for cmd, desc in data_generators:
        if run_command(cmd, f"Generating {desc}"):
            data_success += 1
    
    print(f"\n📊 Data Generation Complete: {data_success}/{len(data_generators)} datasets")
    
    if data_success < len(data_generators):
        print("⚠️  Some data generation failed. Continuing with training...")
    
    # Step 2: Train Models
    print("\n" + "="*60)
    print("🤖 STEP 2: TRAINING ML MODELS")
    print("="*60)
    
    training_scripts = [
        ("python ECG/train_ecg.py", "ECG Model"),
        ("python EEG/train_eeg.py", "EEG Model"),
        ("python EMG/train_emg.py", "EMG Model"),
        ("python heart/train_heart.py", "Heart Disease Model"),
        ("python diabetes/train_diabetes.py", "Diabetes Model"),
        ("python stroke/train_stroke.py", "Stroke Model"),
    ]
    
    training_success = 0
    for cmd, desc in training_scripts:
        if run_command(cmd, f"Training {desc}"):
            training_success += 1
    
    # Step 3: Verify Models
    print("\n" + "="*60)
    print("🔍 STEP 3: VERIFYING TRAINED MODELS")
    print("="*60 + "\n")
    
    model_files = [
        "ECG/ECG_model.pkl",
        "EEG/EEG_model.pkl",
        "EMG/EMG_model.pkl",
        "heart/heart_model.pkl",
        "diabetes/diabetes_model.pkl",
        "stroke/stroke_model.pkl",
    ]
    
    verified = 0
    for model_file in model_files:
        if os.path.exists(model_file):
            size = os.path.getsize(model_file) / 1024
            print(f"✅ {model_file} ({size:.1f} KB)")
            verified += 1
        else:
            print(f"❌ {model_file} - NOT FOUND")
    
    # Final Summary
    print("\n" + "="*60)
    print("📋 SETUP SUMMARY")
    print("="*60)
    print(f"📊 Datasets Generated: {data_success}/{len(data_generators)}")
    print(f"🤖 Models Trained: {training_success}/{len(training_scripts)}")
    print(f"✅ Models Verified: {verified}/{len(model_files)}")
    
    if verified == len(model_files):
        print("\n🎉 SUCCESS! All models ready for deployment!")
        print("\nNext steps:")
        print("  1. Test locally: cd api && uvicorn main:app --reload")
        print("  2. Deploy to Render: git push (if connected to Render)")
        print("  3. Or manually deploy using render.yaml")
    else:
        print("\n⚠️  INCOMPLETE SETUP")
        print(f"Missing {len(model_files) - verified} model(s)")
        print("Please check the errors above and run training manually if needed.")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()
