//curl -X GET --header "Content-Type: application/json" "https://api.westfield.io/v1/search/movies?fields=title&limit=5&centre_id=sanfrancisco&api_key=WVtpIEkCsBADi2NKgKyI62CEtITrEFjE"
var http = require('https');

var getMoviesByCentre = function (centreId, callback) {
  requestMovies(process.env["WF_MOVIES_API_ENDPOINT"] + "?api_key=" + process.env["WF_API_KEY"], "&centre_id=" + centreId + "&fields=title%2Csessions&limit=20", function(err, data) {
    if (err) {
      return callback(err)
    }

    return callback(err, data)
  })
}

var requestMovies = function (endpoint, queryString, callback) {
  http.get(endpoint + queryString, function (res) {
      var responseString = '';
      console.log('Status Code: ' + res.statusCode);

      if (res.statusCode != 200) {
          callback(new Error("Non 200 Response"));
      }

      res.on('data', function (data) {
          responseString += data;
      });

      res.on('end', function () {
          var responseObject = JSON.parse(responseString);

          if (responseObject.error) {
              console.log("NOAA error: " + responseObject.error.message);
              callback(new Error(responseObject.error.message));
          } else {
              callback(null, responseObject);
          }
      });
  }).on('error', function (e) {
      console.log("Communications error: " + e.message);
      callback(new Error(e.message));
  });
}

module.exports = {
  getMoviesByCentre : getMoviesByCentre
}
