var http = require('https');

var getEventsByCenter = function (centreId, callback) {
  requestEvents(process.env["WF_EVENTS_API_ENDPOINT"] + "?api_key=" + process.env["WF_API_KEY"], "&centre_id=" + centreId + "&fields=name%2Cdescription%2Clocations&per_page=3&status=active", function(err, data) {
    if (err) {
      return callback(err)
    }

    return callback(err, data)
  })
}

var requestEvents = function (endpoint, queryString, callback) {
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
  getEventsByCenter : getEventsByCenter
}
