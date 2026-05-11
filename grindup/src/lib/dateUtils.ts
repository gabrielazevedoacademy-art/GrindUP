export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = dateString.includes('T')
      ? new Date(dateString)
      : new Date(dateString + 'T12:00:00')
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = dateString.includes('T')
      ? new Date(dateString)
      : new Date(dateString + 'T12:00:00')
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return ''
  }
}
