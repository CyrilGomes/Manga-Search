const main = () => {
  const character = window.location.search.split('=')[1];
  const urlSearch = 'http://dbpedia.org/sparql';

  const query = `SELECT ?uri ?name ?description ?firstAppearance GROUP_CONCAT (DISTINCT ?manga; separator="|") as ?mangas GROUP_CONCAT (DISTINCT ?voice; separator="|") as ?voiceActors WHERE { 
    ?uri rdfs:label ?name; 
    rdfs:comment ?description; 
    dbo:firstAppearance ?firstAppearance; 
    dbo:series ?manga;
    dbo:voice ?voice. 
    FILTER(?uri=dbr:${character}
    && lang(?name)="en" 
    && lang(?description)="en" 
    ) }  `;

  const queryUrl =
    urlSearch + '?query=' + encodeURIComponent(query) + '&format=json';

  $.ajax({
    dataType: 'jsonp',
    url: queryUrl,
    success: (data) => {
      console.log('basicInfos data', data);

      const name = data.results.bindings[0].name.value;
      const description = data.results.bindings[0].description.value;
      const firstAppearance = data.results.bindings[0].firstAppearance.value;
      const mangas = data.results.bindings[0].mangas.value.split('|');
      const voiceActors = data.results.bindings[0].voiceActors.value.split('|');

      document.title = name;
      $('#name').text(name);
      $('#description').text(description);
      $('#firstAppearance').text(firstAppearance);
      $('#voiceActors').html(arrayToHtml(voiceActors));

      let mangasHtml = '<ul>';
      mangas.forEach((mangaUri) => {
        mangasHtml += '<li>';
        mangasHtml += `<a href="manga.html?manga=${
          mangaUri.split('resource/')[1]
        }">`;
        mangasHtml += formatUri(mangaUri);
        mangasHtml += '</a>';
        mangasHtml += '</li>';
      });
      mangasHtml += '</ul>';

      $('#mangas').html(mangasHtml);
    },
  });
};

const formatUri = (uri) => {
  return uri.split('resource/')[1].replaceAll('_', ' ');
};

const arrayToHtml = (array) => {
  let html = '<ul>';
  for (const uri of array) {
    html += '<li>';
    html += formatUri(uri);
    html += '</li>';
  }
  html += '</ul>';

  return html;
};
// launching the script when the document is ready
$(document).ready(main);
