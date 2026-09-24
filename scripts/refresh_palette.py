from pathlib import Path

root = Path('/home/ubuntu/aula-ia-cientifica/client/src')
replacements = {
    '#164e52': '#26356b',
    '#267b78': '#5b4bdb',
    '#226b6d': '#4036a5',
    '#ef7e60': '#e27a4f',
    '#ffad92': '#f4a67d',
    '#d8f3ef': '#e4e8ff',
    '#ffe2d8': '#ffe7d6',
    '#e6e0ff': '#e7ddff',
    '#fff1bd': '#fff0c7',
    '#c7614c': '#b55e3d',
    '#a44d3c': '#9b4b34',
    '#2c7474': '#4b55a5',
    '#376e70': '#4e5894',
    '#4b8887': '#6972bd',
    '#236568': '#3d478e',
    '#9cdbd1': '#c8c9ff',
    '#c5e3df': '#d7d9f5',
    '#8bd7cc': '#b9b7ff',
}
for path in root.rglob('*'):
    if path.suffix not in {'.tsx', '.ts', '.css', '.html'}:
        continue
    text = path.read_text()
    updated = text
    for old, new in replacements.items():
        updated = updated.replace(old, new)
    if updated != text:
        path.write_text(updated)
print('Palette refreshed across client source.')
