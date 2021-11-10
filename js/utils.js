async function getWikipediaThumbnail(resourceName) {
  var url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&pilicense=any&formatversion=2&prop=pageimages|pageterms&piprop=original&titles=" +
    resourceName;

  var data = await $.ajax({
    dataType: "jsonp",
    url: url,
  });

  try {
    return $("<img src="+data["query"]["pages"][0]["original"]["source"]+"></img>");
  } catch (error) {
    return $("<img src=''></img>");
  }
  
}
