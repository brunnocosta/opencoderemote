export function summarizeDiff(diff: { additions: number; deletions: number }) {
  return `+${diff.additions} -${diff.deletions}`
}
