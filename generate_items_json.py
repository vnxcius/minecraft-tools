import json
import os

input_folder = "./public/minecraft/1.21.10"
output_file = "./src/app/tool/item-checklist/items.json"

items = []

for filename in os.listdir(input_folder):
    if filename.lower().endswith(".webp"):
        name = os.path.splitext(filename)[0].replace("_", " ").title()
        items.append({"name": name, "path": filename})

data = {"items": items}

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
