import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

// ── Constante ────────────────────────────────────────────────────────────────

const SKIP_BT = /SOLD ANTERIOR|SOLD FINAL ZI|RULAJ ZI|SOLD FINAL CONT|RULAJ TOTAL CONT|SUME BLOCATE/i
const SKIP_BCR = /Final transactions|Final amount balance|Initial amount balance|Total transactions/i

const MONTH_MAP = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
}

// ── Detectie categorie ────────────────────────────────────────────────────────

function detectCatBT(desc) {
  const u = desc.toUpperCase()
  if (/CANTINA|RESTAURANT|SUPERMARKET|ALIMENTAR|KAUFLAND|LIDL|PENNY/.test(u)) return 'Mâncare'
  if (/VODAFONE|TELEKOM|ORANGE|DIGI|UTILIT/.test(u)) return 'Facturi & Utilități'
  if (/\bPOS\b/.test(u)) return 'Cumpărături'
  if (/P2P|TRANSFER|BTPAY/.test(u)) return 'Altele'
  return 'Altele'
}

function detectCatBCR(desc) {
  const u = desc.toUpperCase()
  if (/CANTINA|RESTAURANT|SUPERMARKET|ALIMENTAR|KAUFLAND|LIDL|PENNY/.test(u)) return 'Mâncare'
  if (/VODAFONE|TELEKOM|ORANGE|DIGI|UTILIT/.test(u)) return 'Facturi & Utilități'
  if (/\bPOS\b/.test(u)) return 'Cumpărături'
  if (/P2P|TRANSFER/.test(u)) return 'Altele'
  return 'Altele'
}

function detectCatRevolut(desc) {
  const l = desc.toLowerCase()
  if (/vodafone|orange|telekom|digi/.test(l)) return 'Facturi & Utilități'
  if (/emag|kaufland|lidl/.test(l)) return 'Cumpărături'
  if (/transfer|payment from|payment to/.test(l)) return 'Altele'
  return 'Altele'
}

// ── Parsare sume ──────────────────────────────────────────────────────────────

// Format romanesc: "1.234,56" sau "42,50"
function parseRoAmount(str) {
  if (!str) return null
  let s = str.trim().replace(/\s/g, '')
  if (!/^\d/.test(s)) return null
  if (s.includes(',')) {
    // virgula = separator zecimal; punctele inainte de grupuri de 3 cifre = mii
    s = s.replace(/\.(?=\d{3}(?:,|$))/g, '').replace(',', '.')
  }
  const n = parseFloat(s)
  return isNaN(n) || n < 0 ? null : n
}

// Format englezesc: "1,234.56" sau "49.99"
function parseEnAmount(str) {
  if (!str) return null
  let s = str.trim().replace(/\s/g, '')
  if (!/^\d/.test(s)) return null
  s = s.replace(/,(?=\d{3})/g, '')
  const n = parseFloat(s)
  return isNaN(n) || n < 0 ? null : n
}

// ── Extragere text PDF ────────────────────────────────────────────────────────

async function extractPDFItems(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const allItems = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const tc = await page.getTextContent()
    for (const item of tc.items) {
      const s = item.str.trim()
      if (s) {
        allItems.push({ str: s, x: item.transform[4], y: item.transform[5] })
      }
    }
  }
  return allItems
}

// Grupeaza itemele in linii vizuale dupa coordonata Y
function itemsToLines(items, tol = 4) {
  const map = new Map()
  for (const item of items) {
    let key = null
    for (const [k] of map) {
      if (Math.abs(k - item.y) <= tol) { key = k; break }
    }
    if (key === null) { key = item.y; map.set(key, []) }
    map.get(key).push(item)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b - a)
    .map(([y, its]) => ({
      y,
      items: its.sort((a, b) => a.x - b.x),
      text: its.sort((a, b) => a.x - b.x).map(i => i.str).join(' ').trim()
    }))
}

// Gaseste coloanele Debit/Credit din linia de header
function findDebitCreditColumns(lines, items) {
  let debitX = null, creditX = null
  for (const line of lines) {
    const lower = line.text.toLowerCase()
    if (lower.includes('debit') && lower.includes('credit')) {
      for (const it of line.items) {
        const t = it.str.toLowerCase()
        if (t === 'debit') debitX = it.x
        if (t === 'credit') creditX = it.x
      }
      if (debitX && creditX) break
    }
  }
  // Fallback pe baza latimii paginii
  const maxX = Math.max(...items.map(i => i.x), 500)
  return {
    debitX: debitX ?? maxX * 0.62,
    creditX: creditX ?? maxX * 0.80
  }
}

// Extrage sumele dintr-o linie in functie de pozitia coloanelor
function extractAmounts(lineItems, debitX, creditX) {
  let debit = null, credit = null
  for (const ai of lineItems) {
    if (ai.x < debitX - 5) continue
    const v = parseRoAmount(ai.str)
    if (v === null) continue
    if (ai.x >= creditX - 5) credit = v
    else debit = v
  }
  return { debit, credit }
}

// ── PARSER BT (Banca Transilvania) ───────────────────────────────────────────
// Format data: DD/MM/YYYY
// Coloane: Data | Descriere | Debit | Credit

export async function parseBT(file) {
  const items = await extractPDFItems(file)
  const lines = itemsToLines(items)
  const { debitX, creditX } = findDebitCreditColumns(lines, items)

  const txs = []
  let cur = null
  const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/

  for (const line of lines) {
    if (!line.items.length) continue
    if (SKIP_BT.test(line.text)) continue

    const first = line.items[0]
    const dm = first.str.match(DATE_RE)

    if (dm) {
      if (cur) txs.push(buildTx(cur, detectCatBT))

      const [, dd, mm, yyyy] = dm
      const descItems = line.items.slice(1).filter(i => i.x < debitX - 5)
      const { debit, credit } = extractAmounts(line.items, debitX, creditX)

      cur = {
        date: `${yyyy}-${mm}-${dd}`,
        description: descItems.map(i => i.str).join(' ').trim(),
        debit,
        credit
      }
    } else if (cur && cur.debit === null && cur.credit === null) {
      // Linie de continuare: cauta sume daca tranzactia nu le are inca
      const { debit, credit } = extractAmounts(line.items, debitX, creditX)
      if (debit !== null || credit !== null) {
        cur.debit = debit
        cur.credit = credit
      }
    }
  }
  if (cur) txs.push(buildTx(cur, detectCatBT))

  return txs.filter(t => t.amount !== null && t.amount !== 0)
}

// ── PARSER BCR (Romanian Commercial Bank) ────────────────────────────────────
// Format data: MM/DD/YYYY (format american)
// Coloane: Operation Date | Explanation | Debit | Credit

export async function parseBCR(file) {
  const items = await extractPDFItems(file)
  const lines = itemsToLines(items)
  const { debitX, creditX } = findDebitCreditColumns(lines, items)

  const txs = []
  let cur = null
  const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/

  for (const line of lines) {
    if (!line.items.length) continue
    if (SKIP_BCR.test(line.text)) continue

    const first = line.items[0]
    const dm = first.str.match(DATE_RE)

    if (dm) {
      if (cur) txs.push(buildTx(cur, detectCatBCR))

      const [, mm, dd, yyyy] = dm // BCR: MM/DD/YYYY
      const descItems = line.items.slice(1).filter(i => i.x < debitX - 5)
      const { debit, credit } = extractAmounts(line.items, debitX, creditX)

      cur = {
        date: `${yyyy}-${mm}-${dd}`,
        description: descItems.map(i => i.str).join(' ').trim(),
        debit,
        credit
      }
    } else if (cur && cur.debit === null && cur.credit === null) {
      const { debit, credit } = extractAmounts(line.items, debitX, creditX)
      if (debit !== null || credit !== null) {
        cur.debit = debit
        cur.credit = credit
      }
    }
  }
  if (cur) txs.push(buildTx(cur, detectCatBCR))

  return txs.filter(t => t.amount !== null && t.amount !== 0)
}

// ── PARSER REVOLUT ────────────────────────────────────────────────────────────
// Format data: "Apr 2, 2026"
// Coloane: Date | Description | Money out | Money in | Balance

function parseRevolutDate(str) {
  const m = str.match(/^([A-Z][a-z]{2})\s+(\d{1,2}),?\s*(\d{4})$/)
  if (!m) return null
  const mm = MONTH_MAP[m[1]]
  return mm ? `${m[3]}-${mm}-${m[2].padStart(2, '0')}` : null
}

export async function parseRevolut(file) {
  const items = await extractPDFItems(file)
  const lines = itemsToLines(items)

  // Detecteaza coloanele Money out / Money in din header
  let outX = null, inX = null
  for (const line of lines) {
    const lt = line.text.toLowerCase()
    if (lt.includes('money out') || (lt.includes('out') && lt.includes('in'))) {
      for (const it of line.items) {
        const t = it.str.toLowerCase()
        if (t === 'out' || t === 'money out') outX = it.x
        if (t === 'in'  || t === 'money in')  inX  = it.x
      }
      if (outX && inX) break
    }
  }

  const maxX = Math.max(...items.map(i => i.x), 500)
  if (!outX) outX = maxX * 0.55
  if (!inX)  inX  = maxX * 0.70

  const txs = []

  for (const line of lines) {
    if (!line.items.length) continue

    // Incearca sa detecteze data din primele 1-3 iteme
    let date = null
    let descStart = 0
    for (let n = 3; n >= 1; n--) {
      const candidate = line.items.slice(0, n).map(i => i.str).join(' ')
      date = parseRevolutDate(candidate)
      if (date) { descStart = n; break }
    }
    if (!date) continue

    const descItems = line.items.slice(descStart).filter(i => i.x < outX - 5)
    const description = descItems.map(i => i.str).join(' ').trim()

    // Money out (cheltuiala) si Money in (venit)
    let moneyOut = null, moneyIn = null
    for (const ai of line.items) {
      if (ai.x >= outX - 5 && ai.x < inX - 5) {
        const v = parseEnAmount(ai.str)
        if (v !== null && moneyOut === null) moneyOut = v
      } else if (ai.x >= inX - 5) {
        const v = parseEnAmount(ai.str)
        if (v !== null && moneyIn === null) moneyIn = v
      }
    }

    if (moneyOut === null && moneyIn === null) continue

    const amount = moneyIn !== null ? moneyIn : -moneyOut
    const desc = description || 'Transaction'
    txs.push({ date, description: desc, amount, category: detectCatRevolut(desc), selected: true })
  }

  return txs.filter(t => t.amount !== null && t.amount !== 0)
}

// ── Helper comun ──────────────────────────────────────────────────────────────

function buildTx(cur, detectFn) {
  const amount = cur.credit !== null
    ? cur.credit
    : cur.debit !== null ? -cur.debit : null
  const desc = cur.description || 'Tranzactie'
  return { date: cur.date, description: desc, amount, category: detectFn(desc), selected: true }
}
