import sys
sys.path.insert(0, 'C:/Users/h4n/Desktop/webappsdesktop/backend')
import main

print(f"PAD_TOP: {main.PAD_TOP}")
print(f"BarChart: {main.BarChart}")
print(f"Reference: {main.Reference}")

# Test _build_excel
from pydantic import BaseModel
from main import SaveProjectRequest

req = SaveProjectRequest(
    project_name="test",
    target_size=224,
    save_directory="C:/Users/h4n/Documents/DropDetect_Projects",
    slides=[
        {"id": "1", "name": "Slide 1", "droplets": [10.5, 15.2, 20.3]}
    ],
    language="th"
)

try:
    main._build_excel(req, "C:/Users/h4n/Documents/DropDetect_Projects/test.xlsx", lang="th")
    print("✓ _build_excel OK")
except Exception as e:
    print(f"✗ _build_excel error: {e}")
    import traceback
    traceback.print_exc()
