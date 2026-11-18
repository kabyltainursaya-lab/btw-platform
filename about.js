/* =============================================================
   ABOUT PAGE SCRIPT (about.js)
   -------------------------------------------------------------
   Builds the "Meet the team" cards from data/team.json.
   Everything else on the About page is plain HTML.

   Photos: each person has a "photo" field.
     ""                      → paper-texture card with initials
     "images/nursaya.jpg"    → the photo
     a wrong path / typo     → the paper card again (no broken image)
   ============================================================= */

async function startAbout() {
  const box = document.getElementById('team');
  let team;
  try {
    team = await loadData('team');   // only this one file is needed here
  } catch (error) {
    showDataError(box, error);
    return;
  }

  box.innerHTML = team.map(function (person) {
    return '<figure class="member">' +
      // pictureHTML is in app.js: photo or designed placeholder ('paper' look)
      pictureHTML(person.photo, person.name, person.photoAlt || person.name, 'paper') +
      '<figcaption><strong>' + escapeHTML(person.name) + '</strong>' +
        '<span class="meta">' + escapeHTML(person.role) + '</span></figcaption>' +
    '</figure>';
  }).join('');
}

startAbout();
