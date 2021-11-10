$(document).ready(() => {
    const author = window.location.search.split('=')[1];
    const urlSearch = 'http://dbpedia.org/sparql';

    const query = `SELECT DISTINCT ?name 
                  (SAMPLE(?description) as ?descriptionAuteur)  
                  (SAMPLE(?birthDate) as ?birthDateAuteur) 
                  (SAMPLE(?birthPlace) as ?birthPlaceAuteur) 
                  (SAMPLE(?debut) as ?debutAuteur)  
                  (SAMPLE(?uri) as ?uriAuteur)  
                  GROUP_CONCAT(DISTINCT ?work; separator="|") as ?works  
                  GROUP_CONCAT(DISTINCT ?award; separator="|") as ?awards WHERE { 
                    ?uri  rdfs:label ?name; 
                    a foaf:Person; 
                    rdfs:comment ?description. 
                    {?uri dbp:birthDate ?birthDate.}
                    UNION
                    {?uri dbo:birthDate ?birthDate.} 
                    {?uri dbp:birthPlace ?birthPlace.}
                    UNION
                    {?uri dbo:birthPlace ?birthPlace.} 
                    {?uri dbp:notableWorks ?work.} 
                    UNION 
                    {?uri dbp:notableworks ?work.}
                    UNION
                    {?uri dbo:knownFor ?work.}
                    OPTIONAL{?uri dbp:yearsActive ?debut .} 
                    OPTIONAL{?uri dbp:awards ?award.} 
                    FILTER(?uri = dbr:${author}
                      && lang(?description)="en" 
                      && lang(?name)="en" 
                    ) 
                  }  `;

    const queryUrl =
      urlSearch + '?query=' + encodeURIComponent(query) + '&format=json';
    console.log(queryUrl);

    $.ajax({
      dataType: 'jsonp',
      url: queryUrl,
      success: (data) => {
        console.log(data);

        const name = data.results.bindings[0].name.value;
        const description = data.results.bindings[0].descriptionAuteur.value;
        const dateBirth = data.results.bindings[0].birthDateAuteur.value;
        const placeBirth = data.results.bindings[0].birthPlaceAuteur.value;
        const works = data.results.bindings[0].works.value.split('|');
        let debut = "unknown";
        let awards = "no awards";

        let worksHtml = '<ul>';
        for (const work of works) {
          let workForm = formatUri(work);
          worksHtml += '<li>';
          worksHtml += "<a href='manga.html?manga="+workForm.replaceAll(' ','_')+"'>"+formatUri(workForm)+"</a>";
          worksHtml += '</li>';
        }
        worksHtml += '</ul>';

        if( data.results.bindings[0].debutAuteur != undefined){
          debut = data.results.bindings[0].debutAuteur.value;
        }

        let awardsHtml = awards;
        if(data.results.bindings[0].awards != undefined){
          awards = data.results.bindings[0].awards.value.split("|");
          awardsHtml = '<ul>';
          for (const award of awards) {
            awardsHtml += '<li>';
            awardsHtml += formatUri(award);
            awardsHtml += '</li>';
          }
          awardsHtml += '</ul>';
        }

        document.title = name;
        $('#name').text(name);
        $('#description').text(description);
        $('#birthDate').text(dateBirth);
        $('#birthPlace').text(placeBirth);
        $('#debut').text(debut);

        $('#works').html(worksHtml);
        
        $('#awards').html(awardsHtml);
      },
    });
  });

  const formatUri = (uri) => {
    if(uri.split('resource/')[1] != undefined){
      return uri.split('resource/')[1].replaceAll('_', ' ');
    }else{
      return uri;
    }
    
  };