export function humanizeEnum(value: string) {
  const words = value
    .split("_")
    .filter(Boolean)
    .map((word) => word === "AI" ? "AI" : word.toLowerCase());
  return words
    .map((word, index) => index === 0 && word !== "AI" ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(" ");
}

export function transactionStatusLabel(status: string) {
  return status === "IN_DELIVERY" ? "In delivery" : humanizeEnum(status);
}

export function genreLabel(genre: string) {
  return genre
    .split("-")
    .map((word) => word === "ai" ? "AI" : word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
