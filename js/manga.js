const main = async () => {
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

  if (manga !== 'Naruto' && manga !== 'One_Piece' && manga!=="Boruto:_Naruto_Next_Generations") {
    const img = await getWikipediaThumbnail(manga);
    $('#image').html(img);
  }
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

const formatUri = (uri) => {
  if (uri.split('resource/')[1] != undefined) {
    return uri.split('resource/')[1].replaceAll('_', ' ');
  } else {
    return uri;
  }
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

var MD5 = function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

async function getWikipediaThumbnail(resourceName) {
  var url =
    'https://en.wikipedia.org/w/api.php?action=query&prop=images&format=json&titles=' +
    resourceName;

  var data = await $.ajax({
    dataType: 'jsonp',
    url: url,
  });

  var item = data['query']['pages'][Object.keys(data['query']['pages'])[0]];

  var wikiImages = [
    'File:commons-logo.svg',
    'Wiki',
    'Edit-clear',
    'File:Symbol category class.svg',
    'File:Wikipe-tan face.svg',
    'File:Question book-new.svg',
  ];

  let isWikiImage = false;
  item['images'].forEach((element) => {
    wikiImages.forEach((wikiIm) => {
      if (element['title'].includes(wikiIm)) {
        isWikiImage = true;
      }
    });
    if (!isWikiImage) {
      imageName = element['title'];
    }
  });

  imageNameClean = imageName.substr(5).replace(/ /g, '_');
  md5Hashed = MD5(imageNameClean);
  imageUrl =
    'https://upload.wikimedia.org/wikipedia/en/' +
    md5Hashed[0] +
    '/' +
    md5Hashed.substr(0, 2) +
    '/' +
    imageNameClean;
  console.log(imageUrl);

  return '<img alt="" src=\'' + imageUrl + "'/>";
}

// launching the script when the document is ready
$(document).ready(main);
