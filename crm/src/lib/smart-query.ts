const OPERATOR_PATTERN = /(tag|blood|status):("[^"]+"|\S+)/gi

export type ParsedQuery = {
  text: string
  tag?: string
  blood?: string
  status?: string
}

export function parseSmartQuery(raw: string): ParsedQuery {
  const parsed: ParsedQuery = { text: raw.trim() }
  let text = raw

  for (const match of raw.matchAll(OPERATOR_PATTERN)) {
    const key = match[1].toLowerCase() as "tag" | "blood" | "status"
    const value = match[2].replace(/"/g, "")
    parsed[key] = value
    text = text.replace(match[0], "")
  }

  parsed.text = text.trim()
  return parsed
}

export function normalizeBloodGroup(value: string) {
  const map: Record<string, string> = {
    "a+": "A_POS", "a-": "A_NEG", "b+": "B_POS", "b-": "B_NEG",
    "ab+": "AB_POS", "ab-": "AB_NEG", "o+": "O_POS", "o-": "O_NEG",
  }
  return map[value.toLowerCase()] ?? value.toUpperCase()
}
