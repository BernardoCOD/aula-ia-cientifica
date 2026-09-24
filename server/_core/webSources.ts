// Búsqueda gratuita en Wikipedia en español (API pública, sin clave). Se usa en el Área de
// consultas cuando la búsqueda de Google de la IA no está disponible en el plan gratuito.

export type WebSource = { title: string; url: string; extract: string };

const API = "https://es.wikipedia.org/w/api.php";
const HEADERS = {
  // Wikipedia pide identificar a las aplicaciones que usan su API.
  "User-Agent": "AulaIACientifica/1.0 (proyecto educativo; Lima, Peru)",
};

async function wikiQuery(params: Record<string, string>) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Wikipedia respondió ${response.status}`);
  return response.json() as Promise<any>;
}

/** Busca artículos y devuelve su introducción en texto plano, sin duplicados. */
export async function searchWikipedia(queries: string[], maxArticles = 4): Promise<WebSource[]> {
  const titles: string[] = [];
  for (const query of queries.slice(0, 3)) {
    const data = await wikiQuery({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: "3",
    }).catch(() => null);
    for (const hit of data?.query?.search ?? [])
      if (!titles.includes(hit.title)) titles.push(hit.title);
  }
  if (!titles.length) return [];
  const data = await wikiQuery({
    action: "query",
    prop: "extracts|info",
    exintro: "1",
    explaintext: "1",
    inprop: "url",
    redirects: "1",
    titles: titles.slice(0, maxArticles).join("|"),
  });
  return (data?.query?.pages ?? [])
    .filter((page: any) => page.extract)
    .map((page: any) => ({
      title: `${page.title} (Wikipedia)`,
      url: page.fullurl ?? `https://es.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      extract: String(page.extract).slice(0, 2500),
    }));
}
