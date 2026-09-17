function capitalizeWord(word: string): string {
  if (!word) return word;
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
}

export function capitalizeFirstLetter(value: string): string {
  const trimmed = value.trim();
  return trimmed ? `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}` : "";
}

export function titleCase(value: string): string {
  return value.trim().split(/\s+/).filter(Boolean).map(capitalizeWord).join(" ");
}

export function sentenceCase(value: string): string {
  return capitalizeFirstLetter(value);
}

export function uppercase(value: string): string {
  return value.trim().toUpperCase();
}
