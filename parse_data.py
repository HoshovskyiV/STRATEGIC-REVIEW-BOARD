import re
import json

persons_path = r"d:\Vibecoding\Synthetic Focus Groups\Persons\Persons.txt"
dispatcher_path = r"d:\Vibecoding\Synthetic Focus Groups\dispatcher prompt\dispatcher prompt.txt"
output_path = r"d:\Vibecoding\Synthetic Focus Groups\FocusGroupApp\data.js"

with open(persons_path, "r", encoding="utf-8") as f:
    text = f.read()

with open(dispatcher_path, "r", encoding="utf-8") as f:
    dispatcher_prompt = f.read()

personas = []
blocks = re.split(r'\n(?=\d+\.)', text)

for i, block in enumerate(blocks):
    if not block.strip(): continue
    lines = block.strip().split('\n')
    header = lines[0]
    
    m = re.match(r'\d+\.\s+([^\(]+)\s+\(([^)]+)\)\s+—\s+«([^»]+)»', header)
    if m:
        name = m.group(1).strip()
        age = m.group(2).strip()
        role = m.group(3).strip()
    else:
        name = header.split("—")[0].split(".")[1].strip() if "—" in header and "." in header else header
        age = ""
        role = header.split("—")[1].strip() if "—" in header else ""
        
    system_prompt = f"Ти маєш відіграти наступну персону. Відповідай від її імені (від першої особи), враховуючи всі її характеристики, світогляд та тригери. Не додавай зайвих привітань, одразу кажи по суті, як людина з цього опису.\n\nОПИС ПЕРСОНИ:\n{block.strip()}"

    personas.append({
        "id": i + 1,
        "name": name,
        "age": age,
        "role": role,
        "raw_prompt": system_prompt
    })

escaped_dispatcher = dispatcher_prompt.replace('`', '\\`')
js_content = f"const DISPATCHER_PROMPT = `{escaped_dispatcher}`;\n\n"
js_content += "const PERSONAS = " + json.dumps(personas, ensure_ascii=False, indent=2) + ";\n"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Successfully wrote {len(personas)} personas to {output_path}")
