from pathlib import Path

for name in ['Diagnostic.tsx', 'Postest.tsx']:
    path = Path('/home/ubuntu/aula-ia-cientifica-web/client/src/pages') / name
    text = path.read_text()
    old = 'onPrevious: () => setVoiceIndex(index => Math.max(index - 1, 0)),\n      onSelectOption:'
    new = '''onPrevious: () => setVoiceIndex(index => Math.max(index - 1, 0)),
      onGoToQuestion: (index) => { const next = Math.max(0, Math.min(index, questions.length - 1)); setVoiceIndex(next); window.setTimeout(() => { const target = document.querySelector<HTMLElement>(`[data-question-index="${next}"]`); target?.scrollIntoView({ behavior: "smooth", block: "center" }); (target?.querySelector("input") as HTMLElement | null)?.focus(); }, 0); },
      onSelectOption:'''
    if old not in text:
        raise SystemExit(f'handler marker not found in {name}')
    text = text.replace(old, new, 1)
    marker = '<fieldset key={question.text}'
    if marker not in text:
        raise SystemExit(f'fieldset marker not found in {name}')
    text = text.replace(marker, '<fieldset data-question-index={index} key={question.text}', 1)
    path.write_text(text)
