from pathlib import Path
p = Path('/home/ubuntu/aula-ia-cientifica/server/research.ts')
s = p.read_text()
s = s.replace('const eligible = Boolean(student.pretestAt) && days >= POSTEST_CONFIG.minDaysFromPretest && progressValue >= POSTEST_CONFIG.minProgress && activitiesValue >= POSTEST_CONFIG.minActivities;', 'const eligibleByProgress = days >= POSTEST_CONFIG.minDaysFromPretest && progressValue >= POSTEST_CONFIG.minProgress && activitiesValue >= POSTEST_CONFIG.minActivities;\n  const eligible = Boolean(student.pretestAt) && (Boolean(student.postestEnabledAt) || eligibleByProgress);')
s = s.replace('  await db.update(students).set({ postestAt: now, lastActivityAt: now }).where(eq(students.id, student.id));\n}\n\nexport async function saveAiInteraction', '  await db.update(students).set({ postestAt: now, lastActivityAt: now }).where(eq(students.id, student.id));\n}\n\nexport async function enablePostest(code: string) {\n  const db = await getDb(); if (!db) return false;\n  const student = (await db.select().from(students).where(eq(students.code, code)).limit(1))[0];\n  if (!student?.pretestAt) return false;\n  await db.update(students).set({ postestEnabledAt: new Date(), lastActivityAt: new Date() }).where(eq(students.id, student.id));\n  return true;\n}\n\nexport async function saveAiInteraction')
s = s.replace('return { code: student.code, school:', 'return { id: student.id, code: student.code, school:')
p.write_text(s)
print('manual postest backend patched')
