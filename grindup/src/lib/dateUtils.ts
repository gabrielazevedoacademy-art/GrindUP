export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    const date = new Date(year, month - 1, day)
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
    const datePart = dateString.split('T')[0]
    const [year, month, day] = datePart.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return ''
  }
}
