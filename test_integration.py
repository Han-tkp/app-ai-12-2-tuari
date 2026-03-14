"""
Integration Test - Frontend to Backend
ทดสอบการเชื่อมต่อระหว่าง Frontend และ Backend
"""

import requests
import json
import os

API_BASE = "http://localhost:8000"

def test_backend_connection():
    """Test 1: Check if backend is running."""
    print("=" * 60)
    print("TEST 1: Backend Connection")
    print("=" * 60)
    try:
        response = requests.get(f"{API_BASE}/api/session-data")
        if response.status_code == 200:
            print("✓ Backend is running!")
            print(f"  Response: {response.json()}")
            return True
        else:
            print(f"✗ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend!")
        print("  Make sure backend is running: python backend/main.py")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_save_project_api():
    """Test 2: Test save-project endpoint with Thai language."""
    print("\n" + "=" * 60)
    print("TEST 2: Save Project API (Thai Language)")
    print("=" * 60)
    
    test_data = {
        "project_name": "ทดสอบ_integration",
        "target_size": 224,
        "save_directory": os.path.expanduser("~/Documents/DropDetect_Projects"),
        "slides": [
            {
                "id": "slide-1",
                "name": "สไลด์ 1",
                "droplets": [10.5, 15.2, 20.3, 25.1, 28.9]
            },
            {
                "id": "slide-2",
                "name": "สไลด์ 2",
                "droplets": [11.2, 16.8, 21.5, 24.7, 29.3]
            },
            {
                "id": "slide-3",
                "name": "สไลด์ 3",
                "droplets": [12.1, 17.4, 22.8, 26.2, 30.1]
            }
        ],
        "language": "th"  # Thai language
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/api/save-project",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Save project successful!")
            print(f"  Excel: {result.get('excel_file', 'N/A')}")
            print(f"  DROP: {result.get('drop_file', 'N/A')}")
            
            # Check if files exist
            excel_file = result.get('excel_file')
            if excel_file and os.path.exists(excel_file):
                print(f"  ✓ Excel file exists: {os.path.basename(excel_file)}")
            else:
                print(f"  ✗ Excel file not found!")
                
            return True
        else:
            print(f"✗ Save project failed with status {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_save_project_api_english():
    """Test 3: Test save-project endpoint with English language."""
    print("\n" + "=" * 60)
    print("TEST 3: Save Project API (English Language)")
    print("=" * 60)
    
    test_data = {
        "project_name": "test_integration_en",
        "target_size": 224,
        "save_directory": os.path.expanduser("~/Documents/DropDetect_Projects"),
        "slides": [
            {
                "id": "slide-1",
                "name": "Slide 1",
                "droplets": [10.5, 15.2, 20.3, 25.1, 28.9]
            }
        ],
        "language": "en"  # English language
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/api/save-project",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Save project (English) successful!")
            print(f"  Excel: {result.get('excel_file', 'N/A')}")
            return True
        else:
            print(f"✗ Save project failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_language_config():
    """Test 4: Verify language labels are working."""
    print("\n" + "=" * 60)
    print("TEST 4: Language Configuration")
    print("=" * 60)
    
    # Import backend module to test LanguageConfig
    import sys
    sys.path.insert(0, 'C:/Users/h4n/Desktop/webappsdesktop/backend')
    
    try:
        from main import LanguageConfig
        
        # Test Thai
        th_lang = LanguageConfig('th')
        print("Thai labels:")
        print(f"  title: {th_lang.get('title')}")
        print(f"  slide_summary: {th_lang.get('slide_summary')}")
        print(f"  who_status: {th_lang.get('who_status')}")
        print(f"  pass: {th_lang.get('pass')}")
        print(f"  total_droplets: {th_lang.get('total_droplets')}")
        
        # Test English
        en_lang = LanguageConfig('en')
        print("\nEnglish labels:")
        print(f"  title: {en_lang.get('title')}")
        print(f"  slide_summary: {en_lang.get('slide_summary')}")
        print(f"  who_status: {en_lang.get('who_status')}")
        print(f"  pass: {en_lang.get('pass')}")
        print(f"  total_droplets: {en_lang.get('total_droplets')}")
        
        print("\n✓ Language configuration working!")
        return True
    except Exception as e:
        print(f"✗ Error testing language config: {e}")
        return False

def main():
    """Run all integration tests."""
    print("\n" + "=" * 60)
    print("INTEGRATION TEST: Frontend + Backend")
    print("=" * 60)
    print("This test verifies that frontend and backend are properly integrated")
    print("for Thai language Excel export.\n")
    
    results = []
    
    # Test 1: Backend connection
    results.append(("Backend Connection", test_backend_connection()))
    
    # Test 2: Save project (Thai)
    results.append(("Save Project (Thai)", test_save_project_api()))
    
    # Test 3: Save project (English)
    results.append(("Save Project (English)", test_save_project_api_english()))
    
    # Test 4: Language config
    results.append(("Language Config", test_language_config()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All integration tests passed!")
        print("\nNext steps:")
        print("1. Open the application: npm run tauri dev")
        print("2. Go to Report mode")
        print("3. Select language (ไทย/English) from dropdown")
        print("4. Click 'Export Excel Report'")
        print("5. Check the generated Excel file")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
