/* =============================================================
   BETWEEN THE LINES — SHARED ENGINE (app.js)
   -------------------------------------------------------------
   Every page loads this file. It does the jobs that are the
   same on every page:
     1. Settings: the list of pages in the menu, and the icons
     2. Data loading: reads our JSON "database" files
     3. Sidebar: builds the menu (sidebar on laptop, bottom bar on phone)
     4. Footer
     5. Fade-in on scroll
     6. Small helpers
     7. Building blocks: covers, book cards, author pictures…
     8. My Shelf: saving items in the browser (localStorage)
     9. Global search
    10. Quiz engine
    11. Start: runs everything when the page opens

   Page-specific code (for example the home dashboard) goes in
   its own small file, like js/home.js.
   ============================================================= */


/* -------------------------------------------------------------
   1. SETTINGS
   ------------------------------------------------------------- */

// The menu. To add a page to the menu, add one line here.
// "id" must match <body data-page="..."> in that HTML file.
const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      href: 'index.html',     icon: 'home' },
  { id: 'library',   label: 'Library',   href: 'library.html',   icon: 'library' },
  { id: 'authors',   label: 'Authors',   href: 'authors.html',   icon: 'person' },
  { id: 'episodes',  label: 'Episodes',  href: 'episodes.html',  icon: 'play' },
  { id: 'resources', label: 'Resources', href: 'resources.html', icon: 'search' },
  { id: 'shelf',     label: 'Shelf',     href: 'shelf.html',     icon: 'bookmark' },
  { id: 'about',     label: 'About',     href: 'about.html',     icon: 'info' }
];

// Simple line icons, drawn with SVG (no emoji, no image files).
// They use "currentColor", so they take the colour of the text.
const ICONS = {
  home:     '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  library:  '<path d="M4 4h4v16H4z"/><path d="M10 4h4v16h-4z"/><path d="M16.5 4.5l3.8 1 -3.6 15.4 -3.8-1z"/>',
  person:   '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 3.8-6 7-6s6 2 7 6"/>',
  play:     '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
  search:   '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
  bookmark: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  bookmarkFilled: '<path d="M6 3h12v18l-6-4.5L6 21z" fill="currentColor"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
  circle: '<circle cx="12" cy="12" r="8.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l2.7 2.7L16 9.8"/>',
  info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>',
  arrow:    '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>'
};

// Returns the full <svg> code for one icon name.
function icon(name) {
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
         'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
         ICONS[name] + '</svg>';
}


/* -------------------------------------------------------------
   2. DATA LOADING
   Our "database" is a set of JSON files in the data/ folder.
   fetch() asks the web server for a file. IMPORTANT: fetch only
   works through a server (Live Server on our Mac, or GitHub Pages
   online). If you double-click the HTML file, the browser blocks
   it for security, and you will see a friendly error instead.
   ------------------------------------------------------------- */

// Files we already loaded are kept here, so each file is
// downloaded only once per page visit.
const dataCache = {};

// Load ONE file, for example: const books = await loadData('books');
async function loadData(name) {
  if (dataCache[name]) {
    return dataCache[name];               // already loaded: reuse it
  }
  const response = await fetch('data/' + name + '.json');
  if (!response.ok) {
    throw new Error('Could not load data/' + name + '.json (status ' + response.status + ')');
  }
  const data = await response.json();     // turn the text into a JavaScript list
  dataCache[name] = data;
  return data;
}

// Load ALL files at the same time. Returns an object like
// { books: [...], authors: [...], episodes: [...], resources: [...], reviews: [...] }
async function loadAllData() {
  const names = ['books', 'authors', 'episodes', 'resources', 'reviews', 'quotes'];
  const lists = await Promise.all(names.map(loadData));   // wait for all of them
  const result = {};
  names.forEach(function (name, i) { result[name] = lists[i]; });
  return result;
}

// Show a friendly message inside "container" when data fails to load.
function showDataError(container, error) {
  console.error(error);   // the technical details go to the browser console
  let help = 'Please refresh the page. If it keeps happening, check that the JSON file has no typing mistakes (a missing comma or quote).';
  if (location.protocol === 'file:') {
    help = 'You opened the file directly. Please open it with <strong>Live Server</strong> in VS Code ' +
           '(right-click the file → "Open with Live Server", or click "Go Live").';
  }
  container.innerHTML =
    '<div class="notice notice-error" role="alert">' +
      '<strong>We couldn’t load the library data.</strong><br>' + help +
    '</div>';
}


/* -------------------------------------------------------------
   3. SIDEBAR
   Each HTML page has an empty <nav id="sidebar"></nav>.
   This function fills it, so the menu is written only once
   (here) instead of in 10 different files.
   ------------------------------------------------------------- */
function buildSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Which page are we on? Read <body data-page="...">
  const currentPage = document.body.dataset.page;

  // Build one <li> for each menu item
  let links = '';
  NAV_ITEMS.forEach(function (item) {
    const isCurrent = item.id === currentPage;
    links +=
      '<li>' +
        '<a class="nav-link" href="' + item.href + '"' + (isCurrent ? ' aria-current="page"' : '') + '>' +
          icon(item.icon) + '<span>' + item.label + '</span>' +
        '</a>' +
      '</li>';
  });

  sidebar.classList.add('sidebar');   // the CSS styles use the class .sidebar
  sidebar.setAttribute('aria-label', 'Main menu');
  sidebar.innerHTML =
    '<a class="sidebar-logo" href="index.html" aria-label="Between the Lines, home">' +
      '<img src="images/favicon-3-black-script.png" alt="" width="48" height="48">' +
    '</a>' +
    '<ul class="nav-list">' + links + '</ul>';

  // Phones: a small top bar with the logo and the name
  const topbar = document.createElement('a');
  topbar.className = 'topbar';
  topbar.href = 'index.html';
  topbar.innerHTML = '<img src="images/favicon-3-black-script.png" alt="" width="36" height="36"> Between the Lines';
  document.querySelector('.main').before(topbar);
}


/* -------------------------------------------------------------
   4. FOOTER
   ------------------------------------------------------------- */
function buildFooter() {
  const main = document.querySelector('.main');
  if (!main) return;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML =
    '<p>© 2026 Between the Lines · Nurorda Almaty</p>' +
    '<p>Made by Kabyltay Nursaya &amp; Uais Nuray</p>';
  main.appendChild(footer);
}


/* -------------------------------------------------------------
   5. FADE-IN ON SCROLL
   Any element with class="reveal" fades in when it scrolls
   into view. Call setupReveal() again after adding new
   elements with JavaScript.
   ------------------------------------------------------------- */
function setupReveal() {
  const items = document.querySelectorAll('.reveal:not(.visible)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // No animation wanted (or very old browser): show everything at once
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  // The "watcher" tells us when an element appears on screen
  const watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        watcher.unobserve(entry.target);   // only animate once
      }
    });
  }, { threshold: 0.1 });

  items.forEach(function (el) { watcher.observe(el); });
}


/* -------------------------------------------------------------
   6. SMALL HELPERS
   ------------------------------------------------------------- */

// Makes text safe before we put it inside HTML.
// Example: a title with "<" or "&" in it won't break the page.
function escapeHTML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Shortcut: get an element by its id.  $('books') = document.getElementById('books')
function $(id) { return document.getElementById(id); }

// Adds <option> elements to a <select> menu.
// options = [{ value: 'ethics', label: 'ethics' }, …]
function addOptions(select, options) {
  options.forEach(function (opt) {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    select.appendChild(el);
  });
}

// Removes repeated values and sorts A→Z
function uniqueSorted(list) {
  return Array.from(new Set(list)).sort(function (a, b) { return a.localeCompare(b); });
}

// Filter pages: choose menu options from the address.
// library.html?subject=ethics → the menu with id "f-subject" is set to "ethics".
// Only used if that option really exists in the menu.
function selectFromUrl(names) {
  const params = new URLSearchParams(location.search);
  names.forEach(function (name) {
    const value = params.get(name);
    const select = $('f-' + name);
    if (value && select && Array.from(select.options).some(function (o) { return o.value === value; })) {
      select.value = value;
    }
  });
}

// Removes our TODO notes from a text before showing it.
// "Comptes Rendus Biologies, 329 (TODO: add pages)" → "Comptes Rendus Biologies, 329"
// "TODO: check the author" → ""
function cleanTodo(text) {
  return String(text || '').replace(/\s*\(?TODO[^)]*\)?/g, '').trim();
}

// Copies text to the clipboard. Returns true if it worked.
// Modern browsers use navigator.clipboard; older ones need the
// "hidden textarea" trick (the second try).
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch (error2) {
      return false;
    }
  }
}

// Find one record in a list by its id.
// Example: findById(data.authors, 'mary-shelley') → the Mary Shelley record
function findById(list, id) {
  return list.find(function (item) { return item.id === id; });
}

// true if a field has real content (not empty, not a "TODO" note).
// We use it to hide TODO notes from visitors.
function hasText(value) {
  return typeof value === 'string' && value.trim() !== '' && !value.trim().startsWith('TODO');
}

// "Mary Shelley" → "MS",  "H. G. Wells" → "HW"
function initials(name) {
  const words = name.replace(/\./g, ' ').split(' ').filter(Boolean);
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Life years: 1797–1851, or "born 1947" for living authors
function lifeYears(author) {
  return author.died ? author.born + '–' + author.died : 'born ' + author.born;
}

// Turns a status from the data into readable words
const STATUS_LABELS = {
  'published': 'Published',
  'in-production': 'In production',
  'coming-soon': 'Coming soon'
};

// The address of a detail page, e.g. pageUrl('books', 'frankenstein') → "book.html?id=frankenstein"
function pageUrl(type, id) {
  const pages = { books: 'book.html', authors: 'author.html', episodes: 'episode.html', resources: 'resources.html' };
  return pages[type] + '?id=' + encodeURIComponent(id);
}


/* -------------------------------------------------------------
   7. BUILDING BLOCKS
   Small functions that return HTML for things we show on many
   pages (covers, book cards, author pictures…). Written once,
   used everywhere, so they always look the same.
   ------------------------------------------------------------- */

// Read the id from the address, e.g. book.html?id=frankenstein → "frankenstein"
function getIdFromUrl() {
  return new URLSearchParams(location.search).get('id');
}

// A friendly "not found" message for detail pages
function notFoundHTML(what, id, backHref, backLabel) {
  return '<div class="notice notice-error" role="alert">' +
    '<strong>' + what + ' not found.</strong><br>' +
    (id ? 'We couldn’t find anything with the id “' + escapeHTML(id) + '”. ' : 'The address has no id. ') +
    'Maybe the link is old or has a typo.<br><br>' +
    '<a class="btn btn-ghost" href="' + backHref + '">' + backLabel + '</a>' +
  '</div>';
}

// A designed book cover, made only with CSS (no copyrighted images).
// The colour comes from "coverColor" in books.json.
function coverHTML(book, authorName) {
  // Only accept real colour codes like #3b2f2f (protects the page from typos)
  const color = /^#[0-9a-fA-F]{3,8}$/.test(book.coverColor) ? book.coverColor : '#3b2f2f';
  return '<div class="cover" style="--cover: ' + color + '" aria-hidden="true">' +
    '<span class="cover-title">' + escapeHTML(book.shortTitle) + '</span>' +
    '<span class="cover-line"></span>' +
    '<span class="cover-author">' + escapeHTML(authorName) + '</span>' +
  '</div>';
}

// A book card: cover + title + author. Used on shelves and grids.
function bookCardHTML(book, data) {
  const author = findById(data.authors, book.author);
  const authorName = author ? author.name : '';
  return '<a class="book-card" href="' + pageUrl('books', book.id) + '">' +
    coverHTML(book, authorName) +
    '<span class="book-card-title">' + escapeHTML(book.shortTitle) + '</span>' +
    '<span class="meta">' + escapeHTML(authorName) + ' · ' + book.year + '</span>' +
    (book.candidate ? '<span class="tag tag-cream">Proposed</span>' : '') +
  '</a>';
}

// ONE function for every picture of a person (authors AND our team).
//   photo: a path like "images/nuray.jpg", or "" if we have no photo yet
//   name:  the person's name (used for the initials and the alt text)
//   alt:   the description for screen readers, e.g. "Portrait of Mary Shelley"
//   look:  'ink'   = dark card with a gold frame (authors, like a book cover)
//          'paper' = cream paper texture (our team)
// No photo → a designed placeholder with initials (no image is requested).
// Wrong path → the browser fails to load it, and handleBrokenImage() below
// swaps in the same placeholder, so the page never shows a broken image.
function pictureHTML(photo, name, alt, look) {
  const lookClass = look === 'paper' ? ' paper' : '';
  if (photo) {
    return '<img class="author-pic' + lookClass + '" src="' + escapeHTML(photo) + '" alt="' + escapeHTML(alt) + '"' +
      ' data-initials="' + initials(name) + '" data-look="' + (look || 'ink') + '">';
  }
  return placeholderHTML(name, look);
}

// The designed placeholder on its own
function placeholderHTML(name, look) {
  return '<div class="author-pic initials' + (look === 'paper' ? ' paper' : '') + '" role="img" ' +
    'aria-label="' + escapeHTML(name) + ' (photo coming soon)">' + initials(name) + '</div>';
}

// Author picture: the public-domain portrait if we have one, otherwise initials
function authorPictureHTML(author) {
  return pictureHTML(author.portrait, author.name, 'Portrait of ' + author.name, 'ink');
}

// All episodes linked to a book. An episode counts if EITHER the book
// lists it in "episodes" OR the episode names the book in "book".
function episodesForBook(data, bookId) {
  const book = findById(data.books, bookId);
  const listed = book ? book.episodes : [];
  return data.episodes.filter(function (ep) {
    return ep.status !== 'coming-soon' && (listed.includes(ep.id) || ep.book === bookId);
  });
}

// A coloured status badge: Published / In production / Coming soon
function statusBadgeHTML(status) {
  return '<span class="tag status-' + escapeHTML(status) + '">' + (STATUS_LABELS[status] || escapeHTML(status)) + '</span>';
}

// All resources linked to an episode. A resource counts if EITHER the
// episode lists it in "resources" OR the resource lists the episode.
function resourcesForEpisode(data, episode) {
  return data.resources.filter(function (r) {
    return episode.resources.includes(r.id) || r.episodes.includes(episode.id);
  });
}

// Gets the 11-letter YouTube video id from what we typed in "youtube".
// Works with: "dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
// "https://youtu.be/dQw4w9WgXcQ". Returns "" if nothing valid.
function youtubeId(value) {
  if (!value) return '';
  const match = String(value).match(/(?:v=|youtu\.be\/|embed\/|^)([A-Za-z0-9_-]{11})(?:[?&#]|$)/);
  return match ? match[1] : '';
}

// All books written by one author
function booksByAuthor(data, authorId) {
  return data.books.filter(function (b) { return b.author === authorId; });
}

// One resource as a list item (type, access, title with link, authors)
const ACCESS_LABELS = { free: 'Free', paywalled: 'Paywalled', check: 'Check access' };

function resourceItemHTML(res) {
  // Link out to the real source if we have a link; otherwise to our resources page
  const title = res.link
    ? '<a href="' + escapeHTML(res.link) + '" target="_blank" rel="noopener">' + escapeHTML(res.title) + ' ' + icon('external') + '<span class="visually-hidden"> (opens in a new tab)</span></a>'
    : '<a href="' + pageUrl('resources', res.id) + '">' + escapeHTML(res.title) + '</a>';
  return '<li>' +
    '<div class="row tags-row"><span class="tag tag-cream">' + escapeHTML(res.type) + '</span>' +
    '<span class="tag tag-green">' + escapeHTML(ACCESS_LABELS[res.access] || res.access) + '</span></div>' +
    title +
    '<span class="meta">' + escapeHTML(authorsAndYear(res)) + '</span>' +
  '</li>';
}

// "Parent, A. (2004)"  — skips TODO authors and missing years
function authorsAndYear(res) {
  const authors = cleanTodo(res.authors);
  const year = res.year ? '(' + res.year + ')' : '';
  return (authors + ' ' + year).trim();
}

// Builds an APA 7 citation (plain text) from a resource's fields.
// Pattern:  Authors. (Year). Title. Source. Link
// If a resource has a "citation" field, we use that exact text instead
// (useful when the automatic one isn't perfect).
function apaCitation(res) {
  if (hasText(res.citation)) return res.citation;

  // Add a full stop at the end, unless there is already . ? ! or …
  function stop(text) {
    text = text.trim();
    return /[.?!…]$/.test(text) ? text : text + '.';
  }

  const authors = cleanTodo(res.authors);
  const year = '(' + (res.year || 'n.d.') + ').';   // n.d. = "no date" in APA
  const title = stop(cleanTodo(res.title));
  const source = cleanTodo(res.source);

  let citation = authors
    ? stop(authors) + ' ' + year + ' ' + title     // Parent, A. (2004). Title.
    : title + ' ' + year;                           // no author: the title goes first
  if (source) citation += ' ' + stop(source);
  if (res.link) citation += ' ' + res.link;         // no full stop after a link
  return citation;
}


/* -------------------------------------------------------------
   8. MY SHELF (localStorage)
   localStorage is a small storage box inside the visitor's
   browser. It remembers things after the page is closed, but
   only on THIS device and THIS browser (no accounts yet).
   We wrap it in try/catch because some browsers block it
   (for example private windows). Then the page still works,
   it just can't remember.

   What we store (as text, under the name "btl-shelf"):
   {
     "books":     ["frankenstein"],
     "episodes":  ["ep1"],
     "resources": ["aldini-1803"],
     "done":      ["episodes:ep1"]   ← marked as watched / read (Step 6)
   }
   ------------------------------------------------------------- */
const SHELF_KEY = 'btl-shelf';

function getShelf() {
  const empty = { books: [], episodes: [], resources: [], done: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(SHELF_KEY));
    return Object.assign(empty, saved);   // fills in anything missing
  } catch (error) {
    return empty;
  }
}

function saveShelf(shelf) {
  try {
    localStorage.setItem(SHELF_KEY, JSON.stringify(shelf));
    return true;
  } catch (error) {
    return false;
  }
}

// Is this item on the shelf?  isSaved('episodes', 'ep1') → true / false
function isSaved(type, id) {
  return getShelf()[type].includes(id);
}

// Has the visitor marked it as watched / read?
function isDone(type, id) {
  return getShelf().done.includes(type + ':' + id);
}

// Add the item if it's missing, remove it if it's there.
// Returns true if the item is saved afterwards.
function toggleSaved(type, id) {
  const shelf = getShelf();
  const list = shelf[type];
  if (list.includes(id)) {
    shelf[type] = list.filter(function (x) { return x !== id; });
  } else {
    list.push(id);
  }
  saveShelf(shelf);
  return shelf[type].includes(id);
}

// HTML for a "Save" button. Any page can use it:
//   container.innerHTML = saveButton('books', 'frankenstein');
function saveButton(type, id) {
  return '<button type="button" class="save-btn" data-save-type="' + type + '" data-save-id="' + escapeHTML(id) + '"></button>';
}

// Mark as watched / read, or remove the mark.
// Marking something also saves it to the shelf (so you can find it there).
function toggleDone(type, id) {
  const shelf = getShelf();
  const key = type + ':' + id;
  if (shelf.done.includes(key)) {
    shelf.done = shelf.done.filter(function (x) { return x !== key; });
  } else {
    shelf.done.push(key);
    if (!shelf[type].includes(id)) shelf[type].push(id);
  }
  saveShelf(shelf);
}

// HTML for a "Mark as watched / read" button (episodes are watched, the rest is read)
function doneButton(type, id) {
  return '<button type="button" class="save-btn done-btn" data-done-type="' + type + '" data-done-id="' + escapeHTML(id) + '"></button>';
}

// Show the right look on every Save and Done button on the page
function updateSaveButtons() {
  document.querySelectorAll('[data-save-type]').forEach(function (btn) {
    const saved = isSaved(btn.dataset.saveType, btn.dataset.saveId);
    btn.setAttribute('aria-pressed', saved);
    btn.innerHTML = icon(saved ? 'bookmarkFilled' : 'bookmark') + '<span>' + (saved ? 'Saved' : 'Save') + '</span>';
  });
  document.querySelectorAll('[data-done-type]').forEach(function (btn) {
    const done = isDone(btn.dataset.doneType, btn.dataset.doneId);
    const watched = btn.dataset.doneType === 'episodes';
    btn.setAttribute('aria-pressed', done);
    btn.innerHTML = icon(done ? 'checkCircle' : 'circle') + '<span>' +
      (done ? (watched ? 'Watched' : 'Read') : (watched ? 'Mark as watched' : 'Mark as read')) + '</span>';
  });
}

// ONE click listener for the whole page (this is called "event delegation").
// It works even for buttons that JavaScript adds later.
document.addEventListener('click', function (event) {
  const saveBtn = event.target.closest('[data-save-type]');
  const doneBtn = event.target.closest('[data-done-type]');
  if (saveBtn) toggleSaved(saveBtn.dataset.saveType, saveBtn.dataset.saveId);
  else if (doneBtn) toggleDone(doneBtn.dataset.doneType, doneBtn.dataset.doneId);
  else return;   // something else was clicked
  updateSaveButtons();
  // Tell the page that the shelf changed (the home and shelf pages listen for this)
  document.dispatchEvent(new Event('shelfchange'));
});


/* Stars for reviews: starsHTML(4) → ★★★★☆ as SVG, read aloud as "4 out of 5 stars" */
function starsHTML(count) {
  const n = Math.max(0, Math.min(5, Math.round(Number(count) || 0)));   // keep it between 0 and 5
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += '<svg class="star' + (i <= n ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>';
  }
  return '<span class="stars" role="img" aria-label="' + n + ' out of 5 stars">' + stars + '</span>';
}


/* -------------------------------------------------------------
   BROKEN IMAGES → DESIGNED PLACEHOLDERS
   If an image file is missing (or its name has a typo), we swap in
   a designed placeholder instead of the browser's broken-image icon:
     <img … data-initials="KN" data-look="paper">  → initials card
     <img … data-fallback="texture">                → paper texture block
   ------------------------------------------------------------- */
function handleBrokenImage(img) {
  let box;
  if (img.dataset.initials) {
    const holder = document.createElement('div');
    holder.innerHTML = placeholderHTML(img.alt || img.dataset.initials, img.dataset.look);
    box = holder.firstChild;
    box.textContent = img.dataset.initials;   // keep the initials from the data
  } else if (img.dataset.fallback === 'texture') {
    box = document.createElement('div');
    box.className = 'paper-texture';
    box.setAttribute('aria-hidden', 'true');   // decorative only
    box.innerHTML = '<span>Between the Lines</span>';
  } else {
    return;   // other images: leave them alone
  }
  img.replaceWith(box);
}

// "error" events don't bubble, so we listen in the capture phase (the
// "true" at the end). This catches images added later by JavaScript too.
document.addEventListener('error', function (event) {
  if (event.target.tagName === 'IMG') handleBrokenImage(event.target);
}, true);

// Images in the HTML may have failed before this file loaded: check them now
function setupImageFallbacks() {
  document.querySelectorAll('img[data-initials], img[data-fallback]').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) handleBrokenImage(img);
  });
}


/* -------------------------------------------------------------
   9. GLOBAL SEARCH
   Looks for the words in books, authors, episodes and resources.
   Returns a list of results like:
   { type: 'Book', title: 'Frankenstein', detail: 'Mary Shelley · 1818', href: 'book.html?id=frankenstein' }
   ------------------------------------------------------------- */
function searchAll(data, query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];          // wait for at least 2 letters

  // true if the query appears in any of the given texts
  function matches(texts) {
    return texts.join(' ').toLowerCase().includes(q);
  }

  const results = [];

  data.books.forEach(function (book) {
    const author = findById(data.authors, book.author);
    const authorName = author ? author.name : '';
    if (matches([book.title, authorName, book.era].concat(book.subjects))) {
      results.push({ type: 'Book', title: book.shortTitle, detail: authorName + ' · ' + book.year, href: pageUrl('books', book.id) });
    }
  });

  data.authors.forEach(function (author) {
    if (matches([author.name, author.country])) {
      results.push({ type: 'Author', title: author.name, detail: lifeYears(author), href: pageUrl('authors', author.id) });
    }
  });

  data.episodes.forEach(function (ep) {
    if (ep.status === 'coming-soon') return;   // skip empty "Episode 3" placeholders
    if (matches([ep.title, ep.discipline])) {
      results.push({ type: 'Episode', title: ep.title, detail: 'Episode ' + ep.number + ' · ' + ep.discipline, href: pageUrl('episodes', ep.id) });
    }
  });

  data.resources.forEach(function (res) {
    if (matches([res.title, cleanTodo(res.authors), res.type].concat(res.topics))) {
      results.push({ type: 'Resource', title: res.title, detail: authorsAndYear(res), href: pageUrl('resources', res.id) });
    }
  });

  return results;
}


/* -------------------------------------------------------------
   10. QUIZ ENGINE
   Builds a quiz from the "quiz" list of an episode.
   Three question types (written in episodes.json):

   { "type": "multiple-choice", "question": "…",
     "options": ["A", "B", "C"], "answer": 0 }     ← 0 = first option
   { "type": "yes-no", "question": "…", "answer": "no" }
   { "type": "open", "question": "…", "modelAnswer": "…" }

   Use:  buildQuiz(document.getElementById('quiz'), episode.quiz);
   ------------------------------------------------------------- */
function buildQuiz(container, questions) {
  if (!questions || questions.length === 0) {
    container.innerHTML = '<p class="notice">No quiz for this episode yet.</p>';
    return;
  }

  // Questions that can be checked automatically (not "open")
  const checkable = questions.filter(function (q) { return q.type !== 'open'; }).length;
  let answered = 0;
  let correct = 0;

  // 1. Build the HTML for every question
  let html = '';
  questions.forEach(function (q, i) {
    const name = 'q' + i;   // radio buttons of one question share a name
    let body = '';

    if (q.type === 'multiple-choice') {
      body = q.options.map(function (opt, j) {
        return '<label class="option"><input type="radio" name="' + name + '" value="' + j + '"> <span>' + escapeHTML(opt) + '</span></label>';
      }).join('');
    } else if (q.type === 'yes-no') {
      body = ['yes', 'no'].map(function (v) {
        return '<label class="option option-inline"><input type="radio" name="' + name + '" value="' + v + '"> <span>' + (v === 'yes' ? 'Yes' : 'No') + '</span></label>';
      }).join('');
    } else if (q.type === 'open') {
      body =
        '<label class="visually-hidden" for="' + name + '">Your answer</label>' +
        '<textarea id="' + name + '" rows="3" placeholder="Write your answer here (it is not saved or sent anywhere)."></textarea>' +
        '<button type="button" class="btn btn-ghost show-model" data-index="' + i + '">Show model answer</button>';
    }

    html +=
      '<fieldset class="question" data-index="' + i + '">' +
        '<legend><span class="q-num">Question ' + (i + 1) + '</span>' + escapeHTML(q.question) + '</legend>' +
        body +
        '<p class="feedback" aria-live="polite"></p>' +
      '</fieldset>';
  });

  container.innerHTML =
    '<form class="quiz">' + html +
      '<div class="quiz-footer">' +
        '<p class="quiz-score" aria-live="polite"></p>' +
        '<button type="reset" class="text-btn">Try again</button>' +
      '</div>' +
    '</form>';

  const form = container.querySelector('form');
  const scoreBox = container.querySelector('.quiz-score');

  // 2. When a radio button is chosen: check the answer straight away
  form.addEventListener('change', function (event) {
    const input = event.target;
    if (input.type !== 'radio') return;

    const fieldset = input.closest('.question');
    const q = questions[Number(fieldset.dataset.index)];
    const isRight = q.type === 'multiple-choice'
      ? Number(input.value) === q.answer
      : input.value === q.answer;

    // Lock this question so the answer can't be changed
    fieldset.querySelectorAll('input').forEach(function (r) { r.disabled = true; });

    // Colour the options: green = correct answer, red = wrong choice
    fieldset.querySelectorAll('input').forEach(function (r) {
      const rightOne = q.type === 'multiple-choice' ? Number(r.value) === q.answer : r.value === q.answer;
      if (rightOne) r.parentElement.classList.add('correct');
      else if (r === input) r.parentElement.classList.add('wrong');
    });

    const feedback = fieldset.querySelector('.feedback');
    if (isRight) {
      feedback.textContent = 'Correct!';
      correct++;
    } else {
      const rightText = q.type === 'multiple-choice' ? q.options[q.answer] : (q.answer === 'yes' ? 'Yes' : 'No');
      feedback.textContent = 'Not quite. The correct answer is: ' + rightText;
    }
    feedback.className = 'feedback ' + (isRight ? 'is-right' : 'is-wrong');

    answered++;
    if (answered === checkable) {
      scoreBox.textContent = 'You got ' + correct + ' of ' + checkable + ' correct.';
    }
  });

  // 3. Open questions: show the model answer
  form.addEventListener('click', function (event) {
    const btn = event.target.closest('.show-model');
    if (!btn) return;
    const q = questions[Number(btn.dataset.index)];
    const feedback = btn.closest('.question').querySelector('.feedback');
    feedback.className = 'feedback is-model';
    feedback.innerHTML = hasText(q.modelAnswer)
      ? '<strong>Model answer:</strong> ' + escapeHTML(q.modelAnswer)
      : 'The model answer is coming soon.';
  });

  // 4. "Try again": clear everything
  form.addEventListener('reset', function () {
    answered = 0;
    correct = 0;
    scoreBox.textContent = '';
    form.querySelectorAll('input').forEach(function (r) { r.disabled = false; });
    form.querySelectorAll('.correct, .wrong').forEach(function (el) { el.classList.remove('correct', 'wrong'); });
    form.querySelectorAll('.feedback').forEach(function (el) { el.textContent = ''; el.className = 'feedback'; });
  });
}


/* -------------------------------------------------------------
   11. START
   This file is loaded at the end of <body>, so the page's HTML
   already exists and we can run straight away.
   ------------------------------------------------------------- */
document.documentElement.classList.add('js');   // tells the CSS that JavaScript works
buildSidebar();
buildFooter();
setupReveal();
updateSaveButtons();
setupImageFallbacks();
