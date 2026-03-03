"""
Test the Dhanvantari ML API locally
"""

import requests
import json

# API endpoint (change to your Render URL after deployment)
API_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("🏥 Testing Health Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_home():
    """Test home endpoint"""
    print("\n" + "="*60)
    print("🏠 Testing Home Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{API_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict():
    """Test prediction endpoint"""
    print("\n" + "="*60)
    print("🔮 Testing Prediction Endpoint")
    print("="*60)
    
    # Test data - high risk patient
    test_data = {
        "BP": 160.0,
        "HeartRate": 95.0,
        "Glucose": 200.0,
        "SpO2": 94.0,
        "Sleep": 4.5,
        "Steps": 2000.0,
        "hrv_sdnn": 35.0,
        "stress_ratio": 0.8,
        "emg_rms": 0.7
    }
    
    print("\n📊 Input Data:")
    print(json.dumps(test_data, indent=2))
    
    try:
        response = requests.post(
            f"{API_URL}/predict",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✨ Prediction Results:")
            print(json.dumps(result, indent=2))
            
            # Print summary
            print("\n📋 Summary:")
            print(f"  Overall Risk: {result['overall_risk']} ({result['risk_score']:.2%})")
            print(f"  Heart Disease: {result['heart']['status']} ({result['heart']['probability']:.2%})")
            print(f"  Diabetes: {result['diabetes']['status']} ({result['diabetes']['probability']:.2%})")
            print(f"  Stroke: {result['stroke']['status']} ({result['stroke']['probability']:.2%})")
            print(f"  ECG: {result['ecg']['status']} ({result['ecg']['probability']:.2%})")
            print(f"  EEG: {result['eeg']['status']} ({result['eeg']['probability']:.2%})")
            print(f"  EMG: {result['emg']['status']} ({result['emg']['probability']:.2%})")
            return True
        else:
            print(f"❌ Error Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict_normal():
    """Test prediction with normal values"""
    print("\n" + "="*60)
    print("🔮 Testing Prediction (Normal Patient)")
    print("="*60)
    
    # Test data - normal/healthy patient
    test_data = {
        "BP": 120.0,
        "HeartRate": 70.0,
        "Glucose": 95.0,
        "SpO2": 98.0,
        "Sleep": 7.5,
        "Steps": 8000.0,
        "hrv_sdnn": 55.0,
        "stress_ratio": 0.4,
        "emg_rms": 0.5
    }
    
    print("\n📊 Input Data:")
    print(json.dumps(test_data, indent=2))
    
    try:
        response = requests.post(
            f"{API_URL}/predict",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✨ Prediction Results:")
            print(json.dumps(result, indent=2))
            
            # Print summary
            print("\n📋 Summary:")
            print(f"  Overall Risk: {result['overall_risk']} ({result['risk_score']:.2%})")
            return True
        else:
            print(f"❌ Error Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("🧪 DHANVANTARI ML API - TEST SUITE")
    print("="*60)
    print(f"Testing API at: {API_URL}")
    print("\nMake sure the API is running:")
    print("  cd api && uvicorn main:app --reload")
    print("="*60)
    
    results = {
        "Home": test_home(),
        "Health": test_health(),
        "Predict (High Risk)": test_predict(),
        "Predict (Normal)": test_predict_normal()
    }
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    total = len(results)
    passed = sum(results.values())
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! API is ready for deployment.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()
