/* =============================================================
   LIBRARY PAGE SCRIPT (library.js)
   -------------------------------------------------------------
   1. Fill the filter menus from books.json
   2. Read the filters and choose which books to show
   3. Show the books as shelves or as a grid
   4. Start: load data, connect the filters

   Tip: you can open the library with a filter already chosen,
   e.g. library.html?subject=ethics  (the book page uses this).
   ============================================================= */

let DATA = null;          // all our JSON data, after loading
let view = 'shelves';     // 'shelves' or 'grid'

// $, addOptions, uniqueSorted and selectFromUrl live in app.js
// (the resources page uses them too).


/* -------------------------------------------------------------
   1. FILL THE FILTER MENUS
   We collect every subject / era / author that appears in
   books.json. Add a new subject to a book → it appears here.
   ------------------------------------------------------------- */
function fillFilters() {
  // All subjects of all books, in one list (flatMap = map + join the lists)
  const subjects = uniqueSorted(DATA.books.flatMap(function (b) { return b.subjects; }));
  addOptions($('f-subject'), subjects.map(function (s) { return { value: s, label: s }; }));

  const eras = uniqueSorted(DATA.books.map(function (b) { return b.era; }));
  addOptions($('f-era'), eras.map(function (e) { return { value: e, label: e }; }));

  // Only authors who have at least one book
  const authors = DATA.authors
    .filter(function (a) { return booksByAuthor(DATA, a.id).length > 0; })
    .sort(function (a, b) { return a.name.localeCompare(b.name); });
  addOptions($('f-author'), authors.map(function (a) { return { value: a.id, label: a.name }; }));

  // Filters given in the address (e.g. ?subject=ethics)
  selectFromUrl(['subject', 'era', 'author']);
}


/* -------------------------------------------------------------
   2. CHOOSE WHICH BOOKS TO SHOW
   ------------------------------------------------------------- */
function getFilteredBooks() {
  const query = $('f-search').value.trim().toLowerCase();
  const subject = $('f-subject').value;
  const era = $('f-era').value;
  const author = $('f-author').value;
  const onlyWithEpisode = $('f-episode').checked;
  const includeProposed = $('f-proposed').checked;

  return DATA.books
    .filter(function (book) {
      // Each line: if the book fails this test, leave it out
      if (subject && !book.subjects.includes(subject)) return false;
      if (era && book.era !== era) return false;
      if (author && book.author !== author) return false;
      if (onlyWithEpisode && episodesForBook(DATA, book.id).length === 0) return false;
      if (!includeProposed && book.candidate) return false;
      if (query) {
        const a = findById(DATA.authors, book.author);
        const text = [book.title, book.shortTitle, a ? a.name : '', book.era].concat(book.subjects).join(' ').toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;   // passed every test
    })
    .sort(function (a, b) { return a.year - b.year; });   // oldest first
}


/* -------------------------------------------------------------
   3. SHOW THE BOOKS
   ------------------------------------------------------------- */

// The shelves and the rule for which books go on each one
const SHELVES = [
  {
    title: 'Books with an episode',
    intro: 'Watch the episode, then read the book.',
    test: function (b) { return episodesForBook(DATA, b.id).length > 0; }
  },
  {
    title: 'In our library',
    intro: 'Confirmed books, episode coming later.',
    test: function (b) { return !b.candidate && episodesForBook(DATA, b.id).length === 0; }
  },
  {
    title: 'Proposed books',
    intro: 'Books we are still deciding on for future episodes.',
    test: function (b) { return b.candidate && episodesForBook(DATA, b.id).length === 0; }
  }
];

function render() {
  const books = getFilteredBooks();
  const box = $('books');

  $('result-count').textContent = 'Showing ' + books.length + ' of ' + DATA.books.length + ' books';

  if (books.length === 0) {
    box.innerHTML = '<p class="notice">No books found. Try other filters or press “Reset filters”.</p>';
    return;
  }

  if (view === 'grid') {
    box.innerHTML = '<div class="book-grid">' +
      books.map(function (b) { return bookCardHTML(b, DATA); }).join('') +
    '</div>';
    return;
  }

  // Shelves view: one shelf per group (empty shelves are skipped)
  let html = '';
  SHELVES.forEach(function (shelf) {
    const shelfBooks = books.filter(shelf.test);
    if (shelfBooks.length === 0) return;
    html +=
      '<section class="shelf">' +
        '<h2>' + shelf.title + '</h2>' +
        '<p class="meta">' + shelf.intro + '</p>' +
        '<div class="shelf-row">' +
          shelfBooks.map(function (b) { return bookCardHTML(b, DATA); }).join('') +
        '</div>' +
      '</section>';
  });
  box.innerHTML = html;
}

// Switch between "Shelves" and "Grid"
function setView(newView) {
  view = newView;
  $('view-shelves').setAttribute('aria-pressed', view === 'shelves');
  $('view-grid').setAttribute('aria-pressed', view === 'grid');
  render();
}


/* -------------------------------------------------------------
   4. START
   ------------------------------------------------------------- */
async function startLibrary() {
  try {
    DATA = await loadAllData();
  } catch (error) {
    showDataError($('books'), error);
    return;
  }

  fillFilters();
  render();

  const form = $('filters');
  // "input" fires while typing, "change" when a menu or checkbox changes
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  $('f-reset').addEventListener('click', function () {
    form.reset();                                  // back to the default values
    history.replaceState(null, '', 'library.html'); // remove ?subject=… from the address
    render();
  });

  $('view-shelves').addEventListener('click', function () { setView('shelves'); });
  $('view-grid').addEventListener('click', function () { setView('grid'); });
}

startLibrary();
