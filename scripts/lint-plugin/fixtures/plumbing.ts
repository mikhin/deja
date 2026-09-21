const count = (items: string[]): number => {
  let total = 0

  for (const item of items) if (item) total += 1

  return total
}

export const wired = (items: string[]): number => count(items)
