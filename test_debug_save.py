import requests
import json
import os

API_BASE = "http://localhost:8000"

test_data = {
    "project_name": "ทดสอบ_debug",
    "target_size": 224,
    "save_directory": os.path.expanduser("~/Documents/DropDetect_Projects"),
    "slides": [
        {
            "id": "slide-1",
            "name": "สไลด์ 1",
            "droplets": [10.5, 15.2, 20.3, 25.1, 28.9]
        }
    ],
    "language": "th"
}

try:
    response = requests.post(
        f"{API_BASE}/api/save-project",
        json=test_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 500:
        import traceback
        print("\nDetailed error:")
        print(response.json())
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
