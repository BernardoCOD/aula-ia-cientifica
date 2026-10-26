from pathlib import Path
path = Path('/home/ubuntu/aula-ia-cientifica-web/server/routers.ts')
text = path.read_text()
marker = 'Usa el contexto de ruta y pantalla; no ejecutes acciones directamente.'
addition = 'Interpreta activar asistente, hablar con IA u oye Aula IA como ACTIVATE_ASSISTANT, y detener asistente o silenciar asistente como STOP_ASSISTANT. ' + marker
if marker not in text:
    raise SystemExit('conversation prompt marker not found')
path.write_text(text.replace(marker, addition, 1))
