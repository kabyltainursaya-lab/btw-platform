/* =============================================================
   RESOURCES PAGE SCRIPT (resources.js)
   -------------------------------------------------------------
   Our research database: extra learning materials.

   1. Fill the filter menus from resources.json
   2. Choose which resources to show
   3. Build one card per resource
   4. "Copy APA citation" button
   5. Start

   Open it pre-filtered: resources.html?episode=ep1  or  ?book=frankenstein
   Highlight one resource: resources.html?id=parent-2004
   ============================================================= */

let DATA = null;

// Levels in a sensible order (not A→Z)
const LEVELS = ['beginner', 'intermediate', 'advanced'];

// Capital first letter: "beginner" → "Beginner"
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}


/* -------------------------------------------------------------
   1. FILL THE FILTER MENUS
   ------------------------------------------------------------- */
function fillFilters() {
  const types = uniqueSorted(DATA.resources.map(function (r) { return r.type; }));
  addOptions($('f-type'), types.map(function (t) { return { value: t, label: capitalize(t) }; }));

  const topics = uniqueSorted(DATA.resources.flatMap(function (r) { return r.topics; }));
  addOptions($('f-topic'), topics.map(function (t) { return { value: t, label: t }; }));

  // Only episodes and books that have at least one resource
  const episodes = DATA.episodes.filter(function (ep) { return resourcesForEpisode(DATA, ep).length > 0; });
  addOptions($('f-episode'), episodes.map(function (ep) { return { value: ep.id, label: 'Episode ' + ep.number + ': ' + ep.title }; }));

  const books = DATA.books.filter(function (b) {
    return DATA.resources.some(function (r) { return r.books.includes(b.id); });
  });
  addOptions($('f-book'), books.map(function (b) { return { value: b.id, label: b.shortTitle }; }));

  const levels = LEVELS.filter(function (l) { return DATA.resources.some(function (r) { return r.level === l; }); });
  addOptions($('f-level'), levels.map(function (l) { return { value: l, label: capitalize(l) }; }));

  const access = Object.keys(ACCESS_LABELS).filter(function (a) { return DATA.resources.some(function (r) { return r.access === a; }); });
  addOptions($('f-access'), access.map(function (a) { return { value: a, label: ACCESS_LABELS[a] }; }));

  selectFromUrl(['type', 'topic', 'episode', 'book', 'level', 'access']);   // from app.js
}


/* -------------------------------------------------------------
   2. CHOOSE WHICH RESOURCES TO SHOW
   ------------------------------------------------------------- */
function getFiltered() {
  const query = $('f-search').value.trim().toLowerCase();
  const type = $('f-type').value;
  const topic = $('f-topic').value;
  const episodeId = $('f-episode').value;
  const bookId = $('f-book').value;
  const level = $('f-level').value;
  const access = $('f-access').value;

  return DATA.resources
    .filter(function (r) {
      if (type && r.type !== type) return false;
      if (topic && !r.topics.includes(topic)) return false;
      if (episodeId) {
        const ep = findById(DATA.episodes, episodeId);
        if (!ep || !resourcesForEpisode(DATA, ep).includes(r)) return false;
      }
      if (bookId && !r.books.includes(bookId)) return false;
      if (level && r.level !== level) return false;
      if (access && r.access !== access) return false;
      if (query) {
        const text = [r.title, cleanTodo(r.authors), cleanTodo(r.source), r.type]
          .concat(r.topics, hasText(r.note) ? [r.note] : []).join(' ').toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    })
    // Oldest first; resources without a year go to the end
    .sort(function (a, b) { return (a.year || 9999) - (b.year || 9999); });
}


/* -------------------------------------------------------------
   3. ONE CARD PER RESOURCE
   ------------------------------------------------------------- */
const ACCESS_TAG_CLASS = { free: 'tag-green', check: 'tag-cream', paywalled: '' };

function resourceCardHTML(r) {
  // Title: a link to the real source, if we have one
  const title = r.link
    ? '<a href="' + escapeHTML(r.link) + '" target="_blank" rel="noopener">' + escapeHTML(r.title) + '<span class="visually-hidden"> (opens in a new tab)</span></a>'
    : escapeHTML(r.title);

  // Linked episodes and books, as small links
  const episodes = DATA.episodes.filter(function (ep) { return resourcesForEpisode(DATA, ep).includes(r); });
  const books = r.books.map(function (id) { return findById(DATA.books, id); }).filter(Boolean);
  const linkedParts = []
    .concat(episodes.map(function (ep) { return '<a href="' + pageUrl('episodes', ep.id) + '">Episode ' + ep.number + '</a>'; }))
    .concat(books.map(function (b) { return '<a href="' + pageUrl('books', b.id) + '"><em>' + escapeHTML(b.shortTitle) + '</em></a>'; }));

  const openButton = r.link
    ? '<a class="btn" href="' + escapeHTML(r.link) + '" target="_blank" rel="noopener">Open source ' + icon('external') + '<span class="visually-hidden"> (opens in a new tab)</span></a>'
    : '<span class="meta">Link coming soon</span>';

  return '<article class="card resource-card" id="res-' + escapeHTML(r.id) + '">' +
    '<div class="row tags-row">' +
      '<span class="tag tag-cream">' + escapeHTML(capitalize(r.type)) + '</span>' +
      '<span class="tag ' + (ACCESS_TAG_CLASS[r.access] || '') + '">' + escapeHTML(ACCESS_LABELS[r.access] || r.access) + '</span>' +
      '<span class="tag tag-ink">' + escapeHTML(capitalize(r.level)) + '</span>' +
    '</div>' +
    '<h2 class="resource-title">' + title + '</h2>' +
    '<p class="meta">' + escapeHTML(authorsAndYear(r)) + (cleanTodo(r.source) ? ' · ' + escapeHTML(cleanTodo(r.source)) : '') + '</p>' +
    (hasText(r.description) ? '<p class="resource-note">' + escapeHTML(r.description) + '</p>' : '') +
    (hasText(r.note) ? '<p class="resource-note"><strong>Why it’s useful:</strong> ' + escapeHTML(r.note) + '</p>' : '') +
    '<p class="topics">' + r.topics.map(function (t) { return '<span class="topic">#' + escapeHTML(t) + '</span>'; }).join(' ') + '</p>' +
    (linkedParts.length ? '<p class="meta">Used in: ' + linkedParts.join(', ') + '</p>' : '') +
    '<div class="row resource-actions">' +
      openButton +
      '<button type="button" class="btn btn-ghost copy-apa" data-id="' + escapeHTML(r.id) + '">Copy APA citation</button>' +
      saveButton('resources', r.id) +
      doneButton('resources', r.id) +
    '</div>' +
    '<div class="citation-box" hidden></div>' +
  '</article>';
}

function render() {
  const list = getFiltered();
  $('result-count').textContent = 'Showing ' + list.length + ' of ' + DATA.resources.length + ' resources';
  $('resources').innerHTML = list.length === 0
    ? '<p class="notice">No resources found. Try other filters or press “Reset filters”.</p>'
    : '<div class="resource-grid">' + list.map(resourceCardHTML).join('') + '</div>';
  updateSaveButtons();
}


/* -------------------------------------------------------------
   4. COPY APA CITATION
   The citation is built by apaCitation() in app.js.
   We also show it under the button, so you can check it
   (and copy it by hand if the browser blocks copying).
   ------------------------------------------------------------- */
async function handleCopy(button) {
  const r = findById(DATA.resources, button.dataset.id);
  const citation = apaCitation(r);
  const box = button.closest('.resource-card').querySelector('.citation-box');

  const ok = await copyText(citation);   // from app.js

  box.hidden = false;
  box.innerHTML =
    '<p class="citation-status" role="status">' + (ok ? 'Copied! Paste it into your document.' : 'Your browser blocked copying. Select the text below and copy it.') + '</p>' +
    '<p class="citation-text">' + escapeHTML(citation) + '</p>' +
    '<p class="meta">Built automatically from our data. Check it, and add italics (book titles, journal names) in your document.</p>';

  if (ok) {
    button.textContent = 'Copied!';
    setTimeout(function () { button.textContent = 'Copy APA citation'; }, 2000);
  }
}


/* -------------------------------------------------------------
   5. START
   ------------------------------------------------------------- */
async function startResources() {
  try {
    DATA = await loadAllData();
  } catch (error) {
    showDataError($('resources'), error);
    return;
  }

  fillFilters();
  render();

  const form = $('filters');
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  $('f-reset').addEventListener('click', function () {
    form.reset();
    history.replaceState(null, '', 'resources.html');
    render();
  });

  // One click listener for all "Copy APA citation" buttons
  $('resources').addEventListener('click', function (event) {
    const btn = event.target.closest('.copy-apa');
    if (btn) handleCopy(btn);
  });

  // ?id=… (from the search): scroll to that resource and highlight it
  const id = getIdFromUrl();
  const card = id ? document.getElementById('res-' + id) : null;
  if (card) {
    card.classList.add('highlight');
    card.scrollIntoView({ block: 'center' });
  }
}

startResources();
