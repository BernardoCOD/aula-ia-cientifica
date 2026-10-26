from pathlib import Path
path = Path('/home/ubuntu/aula-ia-cientifica-web/client/src/pages/StudentDashboard.tsx')
text = path.read_text()
old = 'const [, navigate] = useLocation(); const [student] = useState<StudentSession | null>(() => getStudent()); const [active, setActive] = useState<Tab>("inicio");'
new = 'const [, navigate] = useLocation(); const [student] = useState<StudentSession | null>(() => getStudent()); const [active, setActive] = useState<Tab>(() => { const requested = new URLSearchParams(window.location.search).get("tab"); return tabs.some(tab => tab.id === requested) ? requested as Tab : "inicio"; });'
if old not in text:
    raise SystemExit('dashboard initialization pattern not found')
path.write_text(text.replace(old, new, 1))
