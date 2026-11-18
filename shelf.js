/* =============================================================
   MY SHELF PAGE SCRIPT (shelf.js)
   -------------------------------------------------------------
   Reads the shelf from localStorage (getShelf() in app.js),
   finds each saved id in our JSON data, and shows:
     1. A progress summary ("5 saved · 2 done")
     2. Three groups: Episodes, Books, Resources
     3. A "Clear my shelf" button that asks first
   The page redraws itself whenever the shelf changes.
   ============================================================= */

let DATA = null;

// The three groups, in the order they appear
const GROUPS = [
  { type: 'episodes',  title: 'Episodes',  data: 'episodes' },
  { type: 'books',     title: 'Books',     data: 'books' },
  { type: 'resources', title: 'Resources', data: 'resources' }
];


/* -------------------------------------------------------------
   ONE SAVED ITEM
   Left: a small picture (cover / episode number / resource type)
   Middle: title and details. Right: buttons.
   ------------------------------------------------------------- */
function itemHTML(type, item) {
  let thumb, title, details;

  if (type === 'books') {
    const author = findById(DATA.authors, item.author);
    thumb = coverHTML(item, author ? author.name : '');
    title = '<a href="' + pageUrl('books', item.id) + '">' + escapeHTML(item.shortTitle) + '</a>';
    details = (author ? escapeHTML(author.name) + ' · ' : '') + item.year;
  } else if (type === 'episodes') {
    thumb = '<span class="shelf-thumb-num">' + item.number + '</span>';
    title = '<a href="' + pageUrl('episodes', item.id) + '">' + escapeHTML(item.title) + '</a>';
    details = 'Episode ' + item.number + ' · ' + escapeHTML(item.discipline) + ' · ' + (STATUS_LABELS[item.status] || '');
  } else {
    thumb = '<span class="shelf-thumb-icon">' + icon('search') + '</span>';
    title = item.link
      ? '<a href="' + escapeHTML(item.link) + '" target="_blank" rel="noopener">' + escapeHTML(item.title) + '<span class="visually-hidden"> (opens in a new tab)</span></a>'
      : '<a href="' + pageUrl('resources', item.id) + '">' + escapeHTML(item.title) + '</a>';
    details = escapeHTML(authorsAndYear(item)) + ' · ' + escapeHTML(item.type);
  }

  const done = isDone(type, item.id);
  return '<li class="shelf-item' + (done ? ' is-done' : '') + '">' +
    '<div class="shelf-thumb">' + thumb + '</div>' +
    '<div class="shelf-info"><span class="shelf-title">' + title + '</span><span class="meta">' + details + '</span></div>' +
    '<div class="shelf-actions">' +
      doneButton(type, item.id) +
      '<button type="button" class="text-btn remove-btn" data-remove-type="' + type + '" data-remove-id="' + escapeHTML(item.id) + '">Remove</button>' +
    '</div>' +
  '</li>';
}


/* -------------------------------------------------------------
   DRAW THE WHOLE SHELF
   ------------------------------------------------------------- */
function render() {
  const box = document.getElementById('shelf');
  const shelf = getShelf();

  // For each group: turn saved ids into records (skip ids that no longer exist)
  let total = 0;
  let doneCount = 0;
  let groupsHTML = '';

  GROUPS.forEach(function (group) {
    const items = shelf[group.type]
      .map(function (id) { return findById(DATA[group.data], id); })
      .filter(Boolean);
    if (items.length === 0) return;

    total += items.length;
    doneCount += items.filter(function (item) { return isDone(group.type, item.id); }).length;

    groupsHTML +=
      '<section class="shelf-group" aria-labelledby="g-' + group.type + '">' +
        '<h2 class="section-title" id="g-' + group.type + '">' + group.title + ' <span class="count">' + items.length + '</span></h2>' +
        '<ul class="shelf-list">' + items.map(function (item) { return itemHTML(group.type, item); }).join('') + '</ul>' +
      '</section>';
  });

  // Empty shelf
  if (total === 0) {
    box.innerHTML =
      '<div class="card empty-shelf">' +
        '<h2 class="section-title">Your shelf is empty</h2>' +
        '<p>Press <strong>Save</strong> on any book, episode or resource, and it will wait for you here.</p>' +
        '<div class="row">' +
          '<a class="btn" href="episodes.html">Browse episodes</a>' +
          '<a class="btn btn-ghost" href="library.html">Open the library</a>' +
          '<a class="btn btn-ghost" href="resources.html">Find resources</a>' +
        '</div>' +
      '</div>';
    return;
  }

  box.innerHTML =
    '<div class="card card-green shelf-summary">' +
      '<p class="shelf-numbers"><strong>' + total + '</strong> saved · <strong>' + doneCount + '</strong> done</p>' +
      '<label class="visually-hidden" for="shelf-progress">Progress</label>' +
      '<progress id="shelf-progress" max="' + total + '" value="' + doneCount + '">' + doneCount + ' of ' + total + '</progress>' +
    '</div>' +
    groupsHTML +
    '<div class="clear-shelf" id="clear-area">' +
      '<button type="button" class="text-btn" id="clear-btn">Clear my shelf</button>' +
    '</div>';
}

// Redraw, but keep the keyboard focus on the same button
// (otherwise keyboard users would lose their place)
function renderKeepFocus() {
  const active = document.activeElement;
  const doneType = active && active.dataset ? active.dataset.doneType : null;
  const doneId = active && active.dataset ? active.dataset.doneId : null;
  render();
  updateSaveButtons();
  if (doneType) {
    const again = document.querySelector('[data-done-type="' + doneType + '"][data-done-id="' + CSS.escape(doneId) + '"]');
    if (again) again.focus();
  }
}


/* -------------------------------------------------------------
   BUTTONS: Remove, and Clear (with "Are you sure?")
   ------------------------------------------------------------- */
function handleClick(event) {
  // Remove one item
  const removeBtn = event.target.closest('.remove-btn');
  if (removeBtn) {
    toggleSaved(removeBtn.dataset.removeType, removeBtn.dataset.removeId);   // saved → not saved
    renderKeepFocus();
    return;
  }

  // "Clear my shelf" → ask first (browsers' confirm() pop-ups can be blocked, so we ask on the page)
  if (event.target.id === 'clear-btn') {
    document.getElementById('clear-area').innerHTML =
      '<p role="alert"><strong>Remove everything from your shelf?</strong> This can’t be undone.</p>' +
      '<div class="row"><button type="button" class="btn btn-dark" id="clear-yes">Yes, clear it</button>' +
      '<button type="button" class="btn btn-ghost" id="clear-no">Cancel</button></div>';
    document.getElementById('clear-no').focus();
    return;
  }
  if (event.target.id === 'clear-yes') {
    saveShelf({ books: [], episodes: [], resources: [], done: [] });
    renderKeepFocus();
    return;
  }
  if (event.target.id === 'clear-no') {
    renderKeepFocus();
  }
}


/* -------------------------------------------------------------
   START
   ------------------------------------------------------------- */
async function startShelf() {
  try {
    DATA = await loadAllData();
  } catch (error) {
    showDataError(document.getElementById('shelf'), error);
    return;
  }
  render();
  updateSaveButtons();

  document.getElementById('shelf').addEventListener('click', handleClick);
  // "Mark as watched" buttons are handled in app.js, which then sends "shelfchange"
  document.addEventListener('shelfchange', renderKeepFocus);
}

startShelf();
