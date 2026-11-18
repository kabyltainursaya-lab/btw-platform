/* =============================================================
   AUTHORS PAGE SCRIPT (authors.js)
   -------------------------------------------------------------
   Shows one card per author in authors.json.
   Authors whose books are ALL proposed get a "Proposed" label.
   ============================================================= */

async function startAuthors() {
  const box = document.getElementById('authors');
  let data;
  try {
    data = await loadAllData();
  } catch (error) {
    showDataError(box, error);
    return;
  }

  if (data.authors.length === 0) {
    box.innerHTML = '<p class="notice">No authors yet.</p>';
    return;
  }

  // Sort by birth year (oldest first)
  const authors = data.authors.slice().sort(function (a, b) { return a.born - b.born; });

  box.innerHTML = '<div class="author-grid">' + authors.map(function (author) {
    const books = booksByAuthor(data, author.id);
    // "every" = true only if ALL books are candidates
    const onlyProposed = books.length > 0 && books.every(function (b) { return b.candidate; });

    return '<a class="card author-card" href="' + pageUrl('authors', author.id) + '">' +
      authorPictureHTML(author) +
      '<h2>' + escapeHTML(author.name) + '</h2>' +
      '<span class="meta">' + lifeYears(author) + ' · ' + escapeHTML(author.country) + '</span>' +
      '<span class="meta">' + books.length + (books.length === 1 ? ' book' : ' books') + ' in our library</span>' +
      (onlyProposed ? '<span class="tag tag-cream">Proposed</span>' : '') +
    '</a>';
  }).join('') + '</div>';
}

startAuthors();
