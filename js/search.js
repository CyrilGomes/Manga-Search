let queryParams = new URLSearchParams(window.location.search);
    let input = queryParams.get("search")

    $(document).ready(init)
    let rechercheAvancee = false
    async function init() {
        let btAdvancedSearch = $('#bt-recherche-avancee');
        btAdvancedSearch.click(function () {
            let iconeRecherche = $('#i-recherche-avancee');
            if (rechercheAvancee) {
                iconeRecherche.toggleClass('active', false);
                $('#champs-recherche-avancee').toggleClass('active', false);
                rechercheAvancee = false;
            } else {
                iconeRecherche.toggleClass('active', true);
                $('#champs-recherche-avancee').toggleClass('active', true);
                rechercheAvancee = true;
            }
        })

        let newDiv = document.createElement('div');
        let currYear = new Date().getFullYear();
        let selectHTML = "";
        selectHTML = "<select class='form-select' id='year'>";
        for (i = 1970; i < currYear; i = i + 1) {
            selectHTML += "<option value='" + i + "'>" + i + "</option>";
        }
        selectHTML += "<option value='" + currYear + "' selected>" + currYear + "</option>";
        selectHTML += "</select>";
        newDiv.innerHTML = selectHTML;
        document.getElementById("year-container").appendChild(newDiv);
        if(input !== null){
            var author = queryParams.get("author")
            var year = queryParams.get("year")
            var filter = queryParams.get("filter")
            await mainSearch(input, author, year, filter)
        }
    }
    function search() {
        let name = $('#name');
        let author = $('#author');
        let year = $('#year');
        let filter = $('#filter');
        let filterText = filter.val().replace('\n', ';');
        let queryText = "search.html?";
        if (!(name.val() === "")) queryText += "search=" + name.val() + "&";
        if (rechercheAvancee) {
            if (!(author.val() === "")) queryText += "author=" + author.val().replace(" ","_") + "&";
            if (!(year.val() === "")) queryText += "year=" + new Date(year.val()).getFullYear() + "&";
            if (!(filterText === "")) queryText += "filter=" + filterText + "&";
        }
        window.location.assign(queryText.substr(0, queryText.length - 1));
    }
    async function mainSearch(uInput, uAuthor, uYear, uFilter) {
        $("#displayResults tr").remove();
        $("#displayResults th").remove();
        $("#displayResults thead").remove();
        var input = uInput.replace(" ", "_");
        var author = "";
        var year = "";
        var filter = "";

        if (rechercheAvancee) {
            author = uAuthor;
            if (author !== null) {
                author = author.replace(" ", "_");
            }
            year = uYear;
            filter = uFilter;
            if (filter !== null) {
                filter = filter.replace(" ", "_");
            }
        }



        /*document.getElementById('search-terms').value = input;*/
        var urlSearch = "http://dbpedia.org/sparql";
        var queryArray = ["SELECT DISTINCT ?manga",
            "(SAMPLE(?author) as ?mangaAuthor)",
            "(SAMPLE(?description) as ?mangaDescription)",
            "(SAMPLE(?demographic) as ?mangaDemographic)",
            "GROUP_CONCAT(DISTINCT ?genre; separator=\"|\") as ?genres WHERE { ?manga dbo:type dbr:Manga ;",
            "rdfs:comment ?description ;",
            "dbo:firstPublicationDate ?startDate ;",
            "dbp:demographic ?demographic ;",
            "dbo:author ?author.",
            "OPTIONAL {?manga dbp:genre ?genre}.",
            "OPTIONAL {?manga dbp:numberOfVolumes ?numberOfVolumes}.",
            "FILTER( regex(?manga, \"" + input + "\",\"i\") && lang(?description)=\"en\""]

        if (author !== "") {
            queryArray.push("&& regex(?author, \"" + author + "\",\"i\")");
        }
        if (year !== "") {
            queryArray.push("&& regex(?startDate, \"" + year + "\", \"i\")");
        }
        if (filter !== "") {
            queryArray.push("&& regex(?manga, \"^((?!" + filter + ").)*$\", \"i\")");
        }
        queryArray.push(") }");
        var query = queryArray.join(" ");

        var queryUrl = urlSearch + "?query=" + encodeURIComponent(query) + "&format=json";
        var data = await $.ajax({
            dataType: "jsonp",
            url: queryUrl,
        });
        console.log(query);

        var grid = $("#displayResults");
        const bindings = data.results.bindings;
        
        /* Mieux de faire notre propre truc pour mettre liens vers nos propres pages (Walid)
        // get the sparql variables from the 'head' of the data.
        var headerVars = data.head.vars;
        // grab the actual results from the data.
        var bindings = data.results.bindings;
        // for each result, make a table row and add it to the table.
        for (rowIdx in bindings) {
            grid.append(await getGridCell(headerVars, bindings[rowIdx]));
        }
        */

        for(const row of bindings){
            const manga = row.manga.value;
            const author = row.mangaAuthor.value;
            const demographic = row.mangaDemographic.value;
            const description  = row.mangaDescription.value;
            const genres = row.genres.value === "" ? [] : row.genres.value.split('|');

            let cell = "<div class='cell'>";
            cell+="<div class='container'>";
            const mangaHtml = "<a class='mangaTitle' href='manga.html?manga="+manga.split('resource/')[1] + "'>"+ formatUri(manga) + '</a>';
            cell+=mangaHtml;
            cell+= "</br>";

            const mangaName = manga.split('resource/')[1];
            const imgUrl = await getWikipediaThumbnail(mangaName);
            cell+=imgUrl;
            cell+="</br>";
            cell+="</div>";

            let authorHtml;
            if (author.split('resource/')[1] != undefined) {
                authorHtml="<div class='author'>Author: "+
                "<a href='author.html?author=" +
                    author.split('resource/')[1] +
                    "'>" +
                    formatUri(author) +
                    '</a>'+"</div>";
                ;
            } else {
                authorHtml=formatUri(author);
            }
            cell+=authorHtml;
            cell+="</br>";

            cell+=`<p>Manga type: ${formatUri(demographic)}</p>`;
            cell+=`<p>${description}</p>`;


            cell+="</div>";

            grid.append(cell);
        }



    }

    
    /*
    async function getGridCell(headerVars, rowData) {

        var cell = $("<div class = 'cell'></div>");
        for(var i in headerVars){
            var fieldData = rowData[headerVars[i]];
            var element = $("<div class = headerVars[i]></div>");
            var splitedData = fieldData["value"].split("|")
            for (var ressource in splitedData){
                var value = $("<div></div>");
                var arrayData = splitedData[ressource].split("http://dbpedia.org/resource/")
                console.log(arrayData)
                var tailleArray = arrayData.length
                var data = arrayData[tailleArray-1]
                if (tailleArray === 1){
                    value.append(fieldData["value"]+" ");
                }
                else{
                    value.append("<a href="+fieldData["value"]+">"+data.replace("_"," ")+"</a> ");
                }
                element.append(value)
            }
            cell.append(element);
        }
        var image = $("<div class = 'image'></div>");
        fieldData = rowData["manga"];
        console.log(fieldData);
        arrayData = fieldData["value"].split("http://dbpedia.org/resource/")
        tailleArray = arrayData.length
        data = arrayData[tailleArray-1]
        image.append(await getWikipediaThumbnail(data));
        cell.append(image);

        return cell;
    }
    */



