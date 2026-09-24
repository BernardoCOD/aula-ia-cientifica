from pathlib import Path
p = Path('/home/ubuntu/aula-ia-cientifica-web/client/src/pages/Admin.tsx')
s = p.read_text()
old = '''<td className="py-4">{student.postest === null && student.pretest !== null && !student.postestEnabled ? <button onClick={() => enablePostest.mutate({ code: student.code })} disabled={enablePostest.isPending} className="rounded-lg bg-[#172554] px-3 py-2 text-xs font-bold text-white hover:bg-[#312e81] disabled:opacity-50">Activar postest</button> : <span className="text-xs text-[#94a3b8]">—</span>}</td>'''
new = '''<td className="py-4"><div className="flex items-center gap-2">{student.postest === null && student.pretest !== null && !student.postestEnabled && <button onClick={() => enablePostest.mutate({ code: student.code })} disabled={enablePostest.isPending} className="rounded-lg bg-[#172554] px-3 py-2 text-xs font-bold text-white hover:bg-[#312e81] disabled:opacity-50">Activar postest</button>}<button onClick={() => { if (window.confirm(`Esta acción eliminará al alumno ${student.code} y todos sus resultados, respuestas y progreso. ¿Deseas continuar?`)) deleteStudent.mutate({ code: student.code, confirmation: "ELIMINAR" }); }} disabled={deleteStudent.isPending} aria-label={`Eliminar alumno ${student.code}`} className="rounded-lg border border-[#fecaca] p-2 text-[#b91c1c] hover:bg-[#fef2f2] disabled:opacity-50"><Trash2 size={16} /></button></div></td>'''
if old not in s:
    raise SystemExit('target table cell not found')
p.write_text(s.replace(old, new, 1))
print('delete button added')
