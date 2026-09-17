function capitalizeWord(word: string): string {
  if (!word) return word;
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
}

export function titleCase(value: string): string {
  return value.trim().split(/\s+/).filter(Boolean).map(capitalizeWord).join(" ");
}

export function sentenceCase(value: string): string {
  const normalized = value.trim().toLowerCase();
  return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : "";
}

export function uppercase(value: string): string {
  return value.trim().toUpperCase();
}
