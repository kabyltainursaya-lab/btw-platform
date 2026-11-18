/* =============================================================
   EPISODES PAGE SCRIPT (episodes.js)
   -------------------------------------------------------------
   Shows every episode from episodes.json as a card, in order
   of their number. The buttons at the top filter by status.
   "Coming soon" episodes are shown faded and are not links yet.
   ============================================================= */

let DATA = null;
let statusFilter = '';   // '' = all

function episodeCardHTML(ep) {
  const book = findById(DATA.books, ep.book);
  const author = book ? findById(DATA.authors, book.author) : null;
  const bookLine = book
    ? '<em>' + escapeHTML(book.shortTitle) + '</em>' + (author ? ' · ' + escapeHTML(author.name) : '')
    : 'Book to be announced';

  const inside =
    '<span class="row tags-row"><span class="pill">Episode ' + ep.number + '</span>' + statusBadgeHTML(ep.status) + '</span>' +
    '<h2 class="episode-card-title">' + escapeHTML(ep.title) + '</h2>' +
    '<span class="meta">' + bookLine + '</span>' +
    '<span class="row tags-row" style="margin-top:12px">' +
      (ep.discipline !== 'TBA' ? '<span class="tag tag-green">' + escapeHTML(ep.discipline) + '</span>' : '') +
      (ep.duration ? '<span class="tag tag-cream">' + escapeHTML(ep.duration) + '</span>' : '') +
    '</span>';

  // Coming soon: a plain card (nothing to open yet)
  if (ep.status === 'coming-soon') {
    return '<div class="card episode-card is-soon">' + inside + '</div>';
  }
  // Otherwise: the whole card is a link, with a round arrow
  return '<a class="card episode-card episode-link" href="' + pageUrl('episodes', ep.id) + '">' +
    '<span class="arrow-btn" aria-hidden="true">' + icon('arrow') + '</span>' + inside +
  '</a>';
}

function render() {
  const box = document.getElementById('episodes');
  const episodes = DATA.episodes
    .filter(function (ep) { return !statusFilter || ep.status === statusFilter; })
    .sort(function (a, b) { return a.number - b.number; });

  if (episodes.length === 0) {
    box.innerHTML = '<p class="notice">No episodes with this status yet.</p>';
    return;
  }
  box.innerHTML = '<div class="episode-grid">' + episodes.map(episodeCardHTML).join('') + '</div>';
}

async function startEpisodes() {
  try {
    DATA = await loadAllData();
  } catch (error) {
    showDataError(document.getElementById('episodes'), error);
    return;
  }
  render();

  // Status buttons: remember the choice, update the look, show the cards again
  const buttons = document.querySelectorAll('.status-filter button');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      statusFilter = btn.dataset.status;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
      render();
    });
  });
}

startEpisodes();
