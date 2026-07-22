// Validates scripts/seed-demo-profiles.sql against the app's real constants,
// so a dorm name or major that doesn't exist in the pickers can't ship.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

mkdirSync('/tmp/seedcheck', { recursive: true }) // scratch copy so the CRA-style ESM source can be imported
const src = readFileSync('/Users/bhanusadhu/lik/src/lib/constants.js', 'utf8')
writeFileSync('/tmp/seedcheck/constants.mjs', src)
const C = await import('/tmp/seedcheck/constants.mjs')

const sql = readFileSync('/Users/bhanusadhu/lik/scripts/seed-demo-profiles.sql', 'utf8')

// each profile row starts with ('<uuid>'::uuid, '<slug>', '<name>', <age>, '<gender>', '<year>', '<major>', '<housing>',
const rowRe = /\('[0-9a-f-]{36}'::uuid,\s*'(\w+)',\s*'([^']+)',\s*(\d+),\s*'(\w+)',\s*'([^']+)',\s*'([^']+)',\s*'(dorm|apartment)',/g

// each VALUES row ends at its quiz jsonb literal; bound the body there so the
// last row doesn't run on into the INSERT's photo-URL template
const bodies = sql
  .split(/\('[0-9a-f-]{36}'::uuid,\s*'\w+',\s*'/)
  .slice(1)
  .map((b) => {
    const end = b.indexOf('::jsonb')
    return end === -1 ? b : b.slice(0, end + '::jsonb'.length)
  })

let rows = [], m, i = 0
while ((m = rowRe.exec(sql))) {
  const [, slug, name, age, gender, year, major, housing] = m
  const body = bodies[i++] || ''
  rows.push({
    slug, name, age: +age, gender, year, major, housing,
    dorms: [...body.matchAll(/array\[([^\]]*)\]::text\[\]|array\[([^\]]*)\]/g)],
    raw: body,
  })
}

const fail = []
const ok = (cond, msg) => { if (!cond) fail.push(msg) }

const DB_KEYS = new Set(C.DEALBREAKERS.map(d => d.key))
const conflictsOf = (k) => (C.DB_BY_KEY[k]?.conflicts) || []

for (const r of rows) {
  ok(C.UIUC_MAJORS.includes(r.major), `${r.slug}: major "${r.major}" not in UIUC_MAJORS`)
  ok(C.YEARS.includes(r.year), `${r.slug}: year "${r.year}" not in YEARS`)
  ok(C.GENDERS.includes(r.gender), `${r.slug}: gender "${r.gender}" not in GENDERS`)
  ok(r.age >= 16 && String(r.age).length === 2, `${r.slug}: age ${r.age} fails the app's own rule`)

  const moveIn = r.raw.match(/'(Fall 2026|Spring 2027|Fall 2027)'/)
  ok(moveIn, `${r.slug}: move_in missing or not in MOVE_IN`)

  // string arrays in this row: dorm list, area list, dealbreaker list
  const arrays = [...r.raw.matchAll(/array\[([^\]]*)\]/g)].map(a =>
    a[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean))

  const dbList = arrays.find(a => a.length && a.every(x => DB_KEYS.has(x)))
  ok(dbList && dbList.length, `${r.slug}: no valid dealbreaker array found`)
  if (dbList) {
    for (const k of dbList) ok(DB_KEYS.has(k), `${r.slug}: unknown dealbreaker "${k}"`)
    for (const k of dbList) {
      for (const c of conflictsOf(k)) {
        ok(!dbList.includes(c), `${r.slug}: self-conflicting limits "${k}" vs "${c}"`)
      }
    }
  }

  const places = arrays.filter(a => a !== dbList).flat()
  for (const p of places) {
    const known = C.DORMS.includes(p) || C.AREAS.includes(p) ||
                  p === 'No preference' || p === 'Anywhere works'
    ok(known, `${r.slug}: place "${p}" is in neither DORMS nor AREAS`)
  }

  const quiz = r.raw.match(/'(\{"sleep".*?\})'::jsonb/s)
  ok(quiz, `${r.slug}: quiz json not found`)
  if (quiz) {
    const q = JSON.parse(quiz[1])
    const keys = C.QUIZ.map(x => x.key)
    ok(Object.keys(q).length === keys.length, `${r.slug}: quiz has ${Object.keys(q).length}/${keys.length} answers`)
    for (const k of keys) ok(q[k] === 'a' || q[k] === 'b', `${r.slug}: quiz key "${k}" missing or invalid`)
  }

  if (r.housing === 'apartment') {
    const b = r.raw.match(/\],\s*(\d+),\s*(\d+),/)
    ok(b, `${r.slug}: apartment profile has no budget pair`)
    if (b) ok(+b[1] < +b[2], `${r.slug}: budget_min ${b[1]} not < budget_max ${b[2]}`)
  }
}

// coverage matrix
const matrix = {}
for (const r of rows) {
  const k = `${r.housing}/${r.gender}`
  matrix[k] = (matrix[k] || 0) + 1
}
for (const housing of ['dorm', 'apartment']) {
  for (const g of ['girl', 'guy', 'nonbinary']) {
    // what a reviewer of gender g sees: same gender + all nonbinary
    const seen = rows.filter(r => r.housing === housing &&
      (r.gender === g || r.gender === 'nonbinary' || g === 'nonbinary')).length
    ok(seen >= 4, `reviewer ${g}/${housing} would see only ${seen} profiles`)
    console.log(`reviewer ${g.padEnd(9)} + ${housing.padEnd(9)} -> ${seen} profiles in feed`)
  }
}

console.log('\nrows parsed:', rows.length)
console.log('matrix:', matrix)
console.log(fail.length ? '\nFAILURES:\n' + fail.join('\n') : '\nALL CHECKS PASSED')
process.exitCode = fail.length ? 1 : 0
