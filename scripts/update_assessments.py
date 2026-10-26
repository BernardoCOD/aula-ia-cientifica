from pathlib import Path
import re

for filename, old_name, new_name in [
    ('client/src/pages/Diagnostic.tsx', 'questions', 'pretestQuestions'),
    ('client/src/pages/Postest.tsx', 'questions', 'postestQuestions'),
]:
    path = Path('/home/ubuntu/aula-ia-cientifica-web') / filename
    text = path.read_text()
    if 'from "@/lib/assessment"' not in text:
        text = text.replace('import { addEvaluation, getStudent } from "@/lib/student";', 'import { addEvaluation, getStudent } from "@/lib/student";\nimport { '+new_name+' } from "@/lib/assessment";')
    text, count = re.subn(r'const questions = \[.*?\n\];\n', f'const questions = {new_name};\n', text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'question block not found in {filename}')
    path.write_text(text)
    print(f'updated {filename}')
