// Client-side generator + strength checker. Nothing here is sent over the network.
const SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
}

// uniform random int in [0, max) using rejection sampling (no modulo bias)
function randInt(max) {
  const limit = Math.floor(0x100000000 / max) * max
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return buf[0] % max
}

export function generatePassword({ length = 16, uppercase = true, lowercase = true, numbers = true, symbols = true } = {}) {
  const pools = Object.entries({ uppercase, lowercase, numbers, symbols })
    .filter(([, on]) => on)
    .map(([k]) => SETS[k])
  if (!pools.length) return ''
  const union = pools.join('')
  const chars = pools.map((p) => p[randInt(p.length)])
  while (chars.length < length) chars.push(union[randInt(union.length)])
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.slice(0, length).join('')
}

const COMMON = ['password', 'qwerty', 'letmein', '123456', 'admin', 'welcome', 'iloveyou', 'abc123']

export function checkStrength(pw) {
  if (!pw) return { score: 0, label: 'Weak', color: '#f87171', suggestions: [] }
  const lower = /[a-z]/.test(pw), upper = /[A-Z]/.test(pw), digit = /\d/.test(pw), symbol = /[^A-Za-z0-9]/.test(pw)
  const pool = (lower ? 26 : 0) + (upper ? 26 : 0) + (digit ? 10 : 0) + (symbol ? 32 : 0)
  let entropy = pool ? pw.length * Math.log2(pool) : 0
  const s = []
  if (pw.length < 12) s.push('Use at least 12 characters.')
  if (!upper) s.push('Add uppercase letters.')
  if (!lower) s.push('Add lowercase letters.')
  if (!digit) s.push('Add numbers.')
  if (!symbol) s.push('Add special characters.')
  if (/(.)\1{2,}/.test(pw)) { s.push('Avoid repeating the same character three or more times.'); entropy -= 10 }
  if (/(012|123|234|345|456|567|678|789|abc|bcd|cde|qwe|asd|zxc)/i.test(pw)) { s.push('Avoid common sequences like 123 or abc.'); entropy -= 10 }
  if (COMMON.some((c) => pw.toLowerCase().includes(c))) { s.push('Avoid common words like "password".'); entropy = Math.min(entropy, 20) }
  let score = Math.max(0, Math.min(100, Math.floor((entropy / 90) * 100)))
  if (pw.length < 12) score = Math.min(score, 69)
  const label = score < 40 ? 'Weak' : score < 70 ? 'Medium' : 'Strong'
  if (label === 'Strong' && !s.length) s.push('Great! Use a unique password for every account.')
  const color = label === 'Weak' ? '#f87171' : label === 'Medium' ? '#fbbf24' : '#59FFB4'
  return { score, label, color, suggestions: s }
}

export const CATEGORIES = ['General', 'Email', 'Social', 'Banking', 'Work', 'Shopping', 'Entertainment', 'Development', 'Other']
