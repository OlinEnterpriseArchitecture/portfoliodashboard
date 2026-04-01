import pandas as pd
import json
import os
import glob

UPLOAD_DIR = "data/uploads"
OUTPUT_DIR = "data/json"

os.makedirs(OUTPUT_DIR, exist_ok=True)

excel_files = glob.glob(f"{UPLOAD_DIR}/*.xlsx") + glob.glob(f"{UPLOAD_DIR}/*.xls")

if not excel_files:
    print("No Excel files found in data/uploads/")
    exit(0)

for excel_path in excel_files:
    filename = os.path.splitext(os.path.basename(excel_path))[0]
    xl = pd.ExcelFile(excel_path)

    result = {}
    for sheet_name in xl.sheet_names:
        df = pd.read_excel(xl, sheet_name=sheet_name)
        # Drop fully empty rows
        df.dropna(how="all", inplace=True)
        # Normalize column names: strip whitespace
        df.columns = [str(c).strip() for c in df.columns]
        result[sheet_name] = json.loads(df.to_json(orient="records", date_format="iso"))

    output_path = os.path.join(OUTPUT_DIR, f"{filename}.json")
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, default=str)

    print(f"Converted: {excel_path} -> {output_path}")
