export function formatFcfa(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
}

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}
