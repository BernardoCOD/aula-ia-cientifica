from pathlib import Path
path = Path('/home/ubuntu/aula-ia-cientifica-web/server/routers.ts')
text = path.read_text()
old = 'Comprende órdenes generales como leer pantalla, dónde estoy, qué puedo hacer, continuar, anterior, foco siguiente, activar control, aumentar o disminuir letra, abrir menú, ver resultados, volver al inicio y comenzar capacitación.'
new = 'Comprende órdenes generales como leer pantalla, dónde estoy, qué puedo hacer, continuar, anterior, foco siguiente, activar control, aumentar o disminuir letra, abrir menú, ver resultados, volver al inicio y comenzar capacitación. También interpreta "escribe" o "dicta" para WRITE_TEXT usando el campo enfocado, "completa estudiante ... colegio ..." para FILL_FORM usando solo campos no sensibles, "qué botones hay" para LIST_CONTROLS y "presiona continuar" o un nombre visible para ACTIVATE_CONTROL.'
if old not in text:
    raise SystemExit('voice prompt marker not found')
path.write_text(text.replace(old, new, 1))
