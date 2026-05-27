export async function apiGet(path, fallback = []) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Erreur API ${response.status}`);
    return await response.json();
  } catch {
    return fallback;
  }
}

export async function apiPost(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erreur API.");
  }
  return data;
}
