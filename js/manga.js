const main = async () => {
  
  // Hides the loading and displays content after 2 secs
  setTimeout(()=>{
    $('#loader').remove();
    $('#main').css('display','block');
  },2500);

  const mangaUnformatted = window.location.search.split('=')[1];
  //Add a \ just before special characters like () or ' to have a correct SPARQL query
  let manga = '';
  for (let i = 0; i < mangaUnformatted.length; i++) {
    if (['(', ')', '!'].includes(mangaUnformatted[i])) {
      manga += '\\';
    }
    manga += mangaUnformatted[i];
  }
  console.log('finalManga', manga);

  const urlSearch = 'http://dbpedia.org/sparql';
  getBasicInfos(manga, urlSearch);
  getCharacters(manga, urlSearch);
  getSameGenreMangas(manga, urlSearch);

  const img = await getWikipediaThumbnail(manga);
  $('#image').html(img);
};

const getBasicInfos = (manga, urlSearch) => {
  const query = `SELECT ?name ?description ?startDate ?author ?publisher ?magazine ?numberOfVolumes GROUP_CONCAT(DISTINCT ?genre; separator="|") as ?genres WHERE {
    ?uri rdfs:label ?name ;
    rdfs:comment ?description.
    {?uri dbo:publisher ?publisher.}
    UNION
    {?uri dbp:publisher ?publisher.}

    {?uri dbo:firstPublicationDate ?startDate.}
    UNION
    {?uri dbp:first ?startDate.}

    {?uri dbp:volumes ?numberOfVolumes.}
    UNION
    {?uri dbo:numberOfVolumes ?numberOfVolumes.}
    UNION
    {?uri dbp:volumenumber ?numberOfVolumes.}

    OPTIONAL{?uri dbp:genre ?genre.}

    {?uri dbo:author ?author.}
    UNION
    {?uri dbo:illustrator ?author.}
    UNION
    {?uri dbp:author ?author.}

    OPTIONAL {
    {?uri dbp:magazine ?magazine.}
    UNION
    {?uri dbp:imprint ?magazine.}
    }

    FILTER (?uri = dbr:${manga}
    && lang(?name)="en"
    && lang(?description)="en"
    )
    } LIMIT 5`;

  const queryUrl =
    urlSearch + '?query=' + encodeURIComponent(query) + '&format=json';

  $.ajax({
    dataType: 'jsonp',
    url: queryUrl,
    success: (data) => {
      console.log('basicInfos data', data);

      const name = data.results.bindings[0].name.value;
      const description = data.results.bindings[0].description.value;
      const startDate = data.results.bindings[0].startDate.value;
      const author = data.results.bindings[0].author.value;
      const publisher = data.results.bindings[0].publisher.value;
      const magazine = data.results.bindings[0]?.magazine?.value || 'Not found';
      const numberOfVolumes = data.results.bindings[0].numberOfVolumes.value;

      var genres = 'non renseigné';
      if (data.results.bindings[0].genres != undefined) {
        genres = data.results.bindings[0].genres.value.split('|');
      }

      document.title = name;
      $('#name').text(name);
      $('#description').text(description);
      if (author.split('resource/')[1] != undefined) {
        $('#author').html(
          "<a href='author.html?author=" +
            author.split('resource/')[1] +
            "'>" +
            formatUri(author) +
            '</a>'
        );
      } else {
        $('#author').text(formatUri(author));
      }
      $('#numberOfVolumes').text(numberOfVolumes);
      $('#startDate').text(startDate);
      $('#publisher').text(formatUri(publisher));
      $('#magazine').text(formatUri(magazine));

      $('#genres').html(arrayToHtml(genres));
    },
  });
};

const getCharacters = (manga, urlSearch) => {
  const query = `SELECT ?characters WHERE { 
        ?characters dbo:series ?uri 
        FILTER(?uri=dbr:${manga})} `;

  const queryUrl =
    urlSearch + '?query=' + encodeURIComponent(query) + '&format=json';

  $.ajax({
    dataType: 'jsonp',
    url: queryUrl,
    success: (data) => {
      const characters = data.results.bindings.map((x) => x.characters.value);
      console.log('characters data', characters);
      if (characters.length === 0) {
        $('#characters').text('No characters found for this manga in DBpedia.');
      } else {
        let charactersHtml = '<ul>';
        characters.forEach((characterUri) => {
          charactersHtml += '<li>';
          charactersHtml += `<a href="character.html?character=${
            characterUri.split('resource/')[1]
          }">`;
          charactersHtml += formatUri(characterUri);
          charactersHtml += '</a>';
          charactersHtml += '</li>';
        });

        charactersHtml += '</ul>';
        $('#characters').html(charactersHtml);
      }
    },
  });
};

const getSameGenreMangas = (manga, urlSearch) => {
  const query = `SELECT ?manga WHERE { 
        ?uri dbp:genre ?genre. 
        ?manga dbp:genre ?genre. 
        ?manga dbo:type dbr:Manga. 
        FILTER(?uri=dbr:${manga} && ?uri!=?manga) 
        } LIMIT 10 `;

  const queryUrl =
    urlSearch + '?query=' + encodeURIComponent(query) + '&format=json';

  $.ajax({
    dataType: 'jsonp',
    url: queryUrl,
    success: (data) => {
      const mangas = data.results.bindings.map((x) => x.manga.value);
      console.log('mangas', mangas);

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

      $('#similarMangas').html(mangasHtml);
    },
  });
};

// launching the script when the document is ready
$(document).ready(main);
