export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'subheading'; id: string; text: string }
  | { type: 'continuation'; text: string }

export interface LegalSection {
  id: string
  heading: string
  blocks: LegalBlock[]
}

export interface ParsedLegalDocument {
  title: string
  versionLine: string
  updatedLine: string
  sections: LegalSection[]
}

const MAIN_SECTION_PATTERN = /^(\d+)\.\s+(.+)$/
const SUBSECTION_PATTERN = /^(\d+\.\d+)\s+(.+)$/
const BULLET_PATTERN = /^\s*•\s+(.+)$/

export function slugifyLegalHeading(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function parseLegalDocument(source: string): ParsedLegalDocument {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const [title = '', versionLine = '', updatedLine = ''] = lines
  const sections: LegalSection[] = []
  let currentSection: LegalSection | null = null

  for (let index = 3; index < lines.length; index += 1) {
    const rawLine = lines[index]
    const line = rawLine.trim()

    if (!line) continue

    const mainMatch = line.match(MAIN_SECTION_PATTERN)
    const isFinalProvision = line === 'DISPOSICIÓN FINAL'

    if (mainMatch || isFinalProvision) {
      currentSection = {
        id: `section-${slugifyLegalHeading(line)}`,
        heading: line,
        blocks: [],
      }
      sections.push(currentSection)
      continue
    }

    if (!currentSection) continue

    const subsectionMatch = line.match(SUBSECTION_PATTERN)
    if (subsectionMatch) {
      currentSection.blocks.push({
        type: 'subheading',
        id: `subsection-${slugifyLegalHeading(line)}`,
        text: line,
      })
      continue
    }

    const bulletMatch = rawLine.match(BULLET_PATTERN)
    if (bulletMatch) {
      const items = [bulletMatch[1]]

      while (index + 1 < lines.length) {
        const nextMatch = lines[index + 1].match(BULLET_PATTERN)
        if (!nextMatch) break
        items.push(nextMatch[1])
        index += 1
      }

      currentSection.blocks.push({ type: 'list', items })
      continue
    }

    if (line === title || line === 'Continuación') {
      currentSection.blocks.push({ type: 'continuation', text: line })
      continue
    }

    currentSection.blocks.push({ type: 'paragraph', text: line })
  }

  return { title, versionLine, updatedLine, sections }
}
