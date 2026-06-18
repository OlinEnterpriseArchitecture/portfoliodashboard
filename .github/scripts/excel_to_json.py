import pandas as pd
import json
import os
import glob

UPLOAD_DIR = "data/uploads"
OUTPUT_DIR = "data/json"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "All_Projects.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

excel_files = glob.glob(f"{UPLOAD_DIR}/*.xlsx") + glob.glob(f"{UPLOAD_DIR}/*.xls")

if not excel_files:
    print("No Excel files found in data/uploads/")
    exit(0)

for excel_path in excel_files:
    xl = pd.ExcelFile(excel_path)

    result = {}
    for sheet_name in xl.sheet_names:
        df = pd.read_excel(xl, sheet_name=sheet_name)
        df.dropna(how="all", inplace=True)
        df.columns = [str(c).strip() for c in df.columns]
        result[sheet_name] = json.loads(df.to_json(orient="records", date_format="iso"))

    with open(OUTPUT_FILE, "w") as f:
        json.dump(result, f, indent=2, default=str)

    print(f"Converted: {excel_path} -> {OUTPUT_FILE}")
