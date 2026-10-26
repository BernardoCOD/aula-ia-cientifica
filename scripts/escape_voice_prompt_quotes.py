from pathlib import Path
path = Path('/home/ubuntu/aula-ia-cientifica-web/server/routers.ts')
text = path.read_text()
for phrase in ['escribe', 'dicta', 'completa estudiante ... colegio ...', 'qué botones hay', 'presiona continuar']:
    text = text.replace(f'"{phrase}"', f'\\"{phrase}\\"')
path.write_text(text)
