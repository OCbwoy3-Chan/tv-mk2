/** Convert SRT cue timestamps without changing caption text or cue identifiers. */
export function srtToVtt(source: string): string {
  const normalized = source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .trim()
  if (!normalized) throw new Error('Empty subtitle file')
  const blocks = normalized.split(/\n[ \t]*\n/)
  const timestamp =
    /^(\d{2,}:\d{2}:\d{2}),(\d{3})\s+-->\s+(\d{2,}:\d{2}:\d{2}),(\d{3})(.*)$/
  const cues = blocks.map(block => {
    const lines = block.split('\n')
    const timingIndex = /^\d+$/.test(lines[0].trim()) ? 1 : 0
    const timing = lines[timingIndex]?.trim()
    if (!timing || !timestamp.test(timing) || lines.length <= timingIndex + 1) {
      throw new Error('Invalid SRT cue')
    }
    lines[timingIndex] = timing.replace(timestamp, '$1.$2 --> $3.$4$5')
    return lines.join('\n')
  })
  return `WEBVTT\n\n${cues.join('\n\n')}\n`
}
