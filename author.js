/* =============================================================
   AUTHOR PAGE SCRIPT (author.js)
   -------------------------------------------------------------
   author.html is ONE page for EVERY author:
   author.html?id=mary-shelley

   Shows the portrait (or initials card), life years, country,
   biography, and a shelf with their books.
   ============================================================= */

async function startAuthor() {
  const box = document.getElementById('author');
  let data;
  try {
    data = await loadAllData();
  } catch (error) {
    showDataError(box, error);
    return;
  }

  // Find the author from the ?id= in the address
  const id = getIdFromUrl();
  const author = findById(data.authors, id);
  if (!author) {
    box.innerHTML = notFoundHTML('Author', id, 'authors.html', 'Back to all authors');
    return;
  }

  document.title = author.name + ' · Between the Lines';

  const books = booksByAuthor(data, author.id);

  // Where the portrait comes from (we always credit our images)
  const source = author.portrait && hasText(author.portraitSource)
    ? '<p class="portrait-source">Image: ' + escapeHTML(author.portraitSource) + '</p>'
    : '';

  const booksShelf = books.length === 0
    ? '<p class="notice">No books by this author in our library yet.</p>'
    : '<div class="shelf-row">' + books.map(function (b) { return bookCardHTML(b, data); }).join('') + '</div>';

  box.innerHTML =
    '<a class="more-link" href="authors.html">← All authors</a>' +
    '<article class="detail" style="margin-top:20px">' +
      '<div class="detail-cover">' + authorPictureHTML(author) + source + '</div>' +
      '<div>' +
        '<span class="pill">/author</span>' +
        '<h1>' + escapeHTML(author.name) + '</h1>' +
        '<dl class="facts">' +
          '<div><dt>' + (author.died ? 'Lived' : 'Born') + '</dt><dd>' + (author.died ? author.born + '–' + author.died : author.born) + '</dd></div>' +
          '<div><dt>Country</dt><dd>' + escapeHTML(author.country) + '</dd></div>' +
          '<div><dt>Books in our library</dt><dd>' + books.length + '</dd></div>' +
        '</dl>' +
        '<h2 class="section-title">Biography</h2>' +
        (hasText(author.bio) ? '<p>' + escapeHTML(author.bio) + '</p>' : '<p class="meta">Biography coming soon.</p>') +
      '</div>' +
    '</article>' +
    '<section class="shelf section" aria-labelledby="books-title">' +
      '<h2 id="books-title">Their books</h2>' +
      booksShelf +
    '</section>';
}

startAuthor();
