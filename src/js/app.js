// Los datos externos se insertan como texto, nunca como HTML.
const $ = id => document.getElementById(id);
let page = 1, totalPages = 1, controller;
function field(parent, label, value) {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value || 'No disponible';
    parent.append(dt, dd);
}
function card(title, image, fields, cover = false) {
    const article = document.createElement('article');
    if (image) {
        const img = document.createElement('img'); img.src = image; img.alt = title; img.loading = 'lazy';
        if (cover) img.className = 'cover';
        img.addEventListener('error', () => { img.hidden = true; }); article.append(img);
    }
    const body = document.createElement('div'); body.className = 'content';
    const h = document.createElement('h2'); h.textContent = title;
    const dl = document.createElement('dl'); fields.forEach(([k, v]) => field(dl, k, v));
    body.append(h, dl); article.append(body); $('grid').append(article);
}
function navigation() {
    $('prev').disabled = page <= 1; $('next').disabled = page >= totalPages;
    $('page').textContent = `Página ${page} de ${totalPages}`;
}
$('search').addEventListener('submit', e => { e.preventDefault(); page = 1; load(); });
$('reset').addEventListener('click', () => { $('search').reset(); page = 1; load(); });
$('prev').addEventListener('click', () => { if (page > 1) { page--; load(); } });
$('next').addEventListener('click', () => { if (page < totalPages) { page++; load(); } });
async function load() {
    controller?.abort(); controller = new AbortController();
    const active = controller;
    const timeout = setTimeout(() => active.abort(), 20000);
    $('status').textContent = 'Consultando la API…'; $('grid').replaceChildren();
    $('prev').disabled = true; $('next').disabled = true;
    try {
        const response = await fetch(buildURL(), { signal: active.signal });
        if (response.status === 404) { totalPages = 1; page = 1; $('status').textContent = 'No se encontraron resultados. Cambiá la búsqueda o los filtros.'; navigation(); return; }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (active !== controller) return;
        render(data); navigation();
    } catch (error) {
        if (active !== controller) return;
        $('status').textContent = `No se pudo consultar la API (${error.name === 'AbortError' ? 'tiempo de espera agotado' : error.message}). Revisá Internet y presioná Buscar para reintentar.`;
        $('page').textContent = 'Consulta pendiente';
    } finally { clearTimeout(timeout); }
}
function buildURL() {
    const url = new URL('https://rickandmortyapi.com/api/character');
    for (const [key, value] of Object.entries({ page, name: $('query').value.trim(), status: $('statusFilter').value, gender: $('gender').value })) if (value) url.searchParams.set(key, value);
    return url;
}
function render(data) {
    totalPages = Math.max(1, data.info.pages);
    data.results.forEach(c => card(c.name, c.image, [['Estado', c.status], ['Especie', c.species], ['Género', c.gender], ['Origen', c.origin?.name]]));
    $('status').textContent = `${data.info.count} personajes encontrados · ${data.results.length} en esta página`;
}
load();
