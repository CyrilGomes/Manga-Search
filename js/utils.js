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

async function getWikipediaThumbnail(resourceName) {
  var url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&pilicense=any&formatversion=2&prop=pageimages|pageterms&piprop=original&titles=" +
    resourceName;

  var data = await $.ajax({
    dataType: "jsonp",
    url: url,
  });

  try {
    return $("<img alt='Image not found' src="+data["query"]["pages"][0]["original"]["source"]+"></img>");
  } catch (error) {
    return $("<img src='' alt='Image not found'></img>");
  }
  
}
