import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

// Extrage textul PDF in linii ordonate de sus in jos
async function getLines(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise
  const all = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const { items } = await page.getTextContent()
    const byY = new Map()
    for (const it of items) {
      if (!it.str?.trim()) continue
      const y = Math.round(it.transform[5] / 3) * 3
      if (!byY.has(y)) byY.set(y, [])
      byY.get(y).push({ x: it.transform[4], s: it.str })
    }
    ;[...byY.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, xs]) => {
        const line = xs.sort((a, b) => a.x - b.x).map(i => i.s).join(' ').replace(/\s+/g, ' ').trim()
        if (line.length > 1) all.push(line)
      })
  }
  return all
}

// Format englezesc: "1,430.54" sau "70.00"
function enNum(s) {
  return parseFloat((s || '').replace(/,/g, '')) || 0
}

// Format romanesc: "1.234,56" sau "42,50"
function roNum(s) {
  const c = (s || '').trim()
  if (/\d\.\d{3},/.test(c)) return parseFloat(c.replace(/\./g, '').replace(',', '.')) || 0
  if (/\d,\d{2}$/.test(c))  return parseFloat(c.replace(',', '.')) || 0
  return parseFloat(c) || 0
}

function toIso(dd, mm, yyyy) {
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

// ── PARSER BT (Banca Transilvania) ───────────────────────────────────────────
// Importa DOAR sumele zilnice totale din randurile "RULAJ ZI"
// Format rand: "DD/MM/YYYY RULAJ ZI <debit> <credit>"
// Exemplu:    "02/03/2026 RULAJ ZI 70.00 250.00"

export async function parseBT(file) {
  const lines = await getLines(file)
  const txs = []

  // Sume BT sunt in format englezesc (punct ca separator zecimal)
  const re = /^(\d{2})\/(\d{2})\/(\d{4})\s+RULAJ\s+ZI\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/i

  for (const line of lines) {
    if (/RULAJ\s+TOTAL\s+CONT/i.test(line)) continue

    const m = line.match(re)
    if (!m) continue

    const [, dd, mm, yyyy, debitStr, creditStr] = m
    const date  = toIso(dd, mm, yyyy)
    const label = `${dd}/${mm}/${yyyy}`
    const debit  = enNum(debitStr)
    const credit = enNum(creditStr)

    if (debit > 0) txs.push({
      date, description: `Cheltuieli BT - ${label}`,
      amount: -debit, category: 'Extras Cont-Cheltuieli', selected: true
    })
    if (credit > 0) txs.push({
      date, description: `Venituri BT - ${label}`,
      amount: credit, category: 'Extras Cont-Venituri', selected: true
    })
  }
  return txs
}

// ── PARSER BCR (Romanian Commercial Bank) ────────────────────────────────────
// Importa sumele zilnice din randurile "Final transactions: <debit> <credit>"
// Data se ia din cel mai recent header "Date: MM/DD/YYYY" de deasupra
// Ultima aparitie "Final transactions:" = totalul general → ignorata

export async function parseBCR(file) {
  const lines = await getLines(file)
  const txs = []

  const dateRe  = /Date:\s*(\d{2})\/(\d{2})\/(\d{4})/i
  const finalRe = /Final\s+transactions:\s*([\d.,]+)\s+([\d.,]+)/i

  const totalFinal = lines.filter(l => finalRe.test(l)).length
  let seenFinal = 0
  let currentDate = null

  for (const line of lines) {
    const dm = line.match(dateRe)
    if (dm) {
      const [, mm, dd, yyyy] = dm
      currentDate = toIso(dd, mm, yyyy)
      continue
    }

    const fm = line.match(finalRe)
    if (!fm) continue

    seenFinal++
    if (seenFinal === totalFinal) continue // total general - skip
    if (!currentDate) continue

    const debit  = roNum(fm[1])
    const credit = roNum(fm[2])
    const [y, mo, d] = currentDate.split('-')
    const label = `${d}/${mo}/${y}`

    if (debit > 0) txs.push({
      date: currentDate, description: `Cheltuieli BCR - ${label}`,
      amount: -debit, category: 'Extras Cont-Cheltuieli', selected: true
    })
    if (credit > 0) txs.push({
      date: currentDate, description: `Venituri BCR - ${label}`,
      amount: credit, category: 'Extras Cont-Venituri', selected: true
    })
  }
  return txs
}

// ── PARSER BRD (BRD - Groupe Société Générale) ───────────────────────────────
// Sume zilnice din randurile "Total debit / Total credit <debit> <credit>"
// Data din cel mai recent rand cu format DD/MM/YYYY
// Sumele folosesc virgula ca separator zecimal (ex: "350,00")

export async function parseBRD(file) {
  const lines = await getLines(file)
  const txs = []

  const dateRe  = /\b(\d{2})\/(\d{2})\/(\d{4})\b/
  const totalRe = /Total\s+debit\s*\/\s*Total\s+credit\s+([\d.,]+)\s+([\d.,]+)/i
  const skip    = /Sold\s+(initial|final)|Start\s+balance|End\s+balance/i

  let currentDate = null

  for (const line of lines) {
    if (skip.test(line)) continue

    const dm = line.match(dateRe)
    if (dm) currentDate = toIso(dm[1], dm[2], dm[3])

    const tm = line.match(totalRe)
    if (!tm || !currentDate) continue

    const debit  = roNum(tm[1])
    const credit = roNum(tm[2])
    const [y, mo, d] = currentDate.split('-')
    const label = `${d}/${mo}/${y}`

    if (debit > 0) txs.push({
      date: currentDate, description: `Cheltuieli BRD - ${label}`,
      amount: -debit, category: 'Extras Cont-Cheltuieli', selected: true
    })
    if (credit > 0) txs.push({
      date: currentDate, description: `Venituri BRD - ${label}`,
      amount: credit, category: 'Extras Cont-Venituri', selected: true
    })
  }
  return txs
}

// ── PARSER REVOLUT ────────────────────────────────────────────────────────────
// Tranzactii individuale, format data "Mar 21, 2026"
// Coloane: money_out RON, money_in RON (cu 0.00 cand nu se aplica), balance RON
// Money out > 0 → cheltuiala; Money in > 0 → venit

export async function parseRevolut(file) {
  const lines = await getLines(file)
  const txs = []
  const MON = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 }
  const skip = /^(date|description|money\s*(out|in)|balance|statement|page|period|account|total)/i

  for (const line of lines) {
    if (skip.test(line)) continue

    const dm = line.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i)
    if (!dm) continue

    const mm    = String(MON[dm[1].slice(0,3).toLowerCase()] || 1).padStart(2,'0')
    const dd    = dm[2].padStart(2,'0')
    const yyyy  = dm[3]
    const date  = `${yyyy}-${mm}-${dd}`
    const label = `${dd}/${mm}/${yyyy}`

    const amounts = [...line.matchAll(/([\d.]+)\s+RON/gi)].map(m => parseFloat(m[1]) || 0)
    if (amounts.length === 0) continue

    const moneyOut = amounts[0] || 0
    const moneyIn  = amounts.length >= 3 ? (amounts[1] || 0) : 0

    if (moneyOut > 0) txs.push({
      date, description: `Cheltuieli Revolut - ${label}`,
      amount: -moneyOut, category: 'Extras Cont-Cheltuieli', selected: true
    })
    if (moneyIn > 0) txs.push({
      date, description: `Venituri Revolut - ${label}`,
      amount: moneyIn, category: 'Extras Cont-Venituri', selected: true
    })
  }
  return txs
}
