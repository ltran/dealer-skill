var http = require('https');

var getDealsByCentre = function (centreId, callback) {
  requestDeals(process.env["WF_DEALS_API_ENDPOINT"] + "?api_key=" + process.env["WF_API_KEY"], "&centre_id=" + centreId + "&fields=title%2Csubtitle%2Cdescription%2Cstores%2C_links&per_page=3&state=live", function(err, data) {
    if (err) {
      return callback(err)
    }

    return callback(err, data)
  })
}

var getDealsByCentreByStore = function (centreId, storeId, callback) {
  requestDeals(process.env["WF_DEALS_API_ENDPOINT"] + "?api_key=" + process.env["WF_API_KEY"], "&centre_id=" + centreId + "&store_id=" + storeId + "&fields=title%2Csubtitle%2Cdescription%2Cstores%2C_links&per_page=3&state=live", function(err, data) {
    if (err) {
      return callback(err)
    }

    return callback(err, data)
  })

}

var getDealsByCentreByRetailer = function (centreId, retailerID, callback) {
  requestDeals(process.env["WF_DEALS_API_ENDPOINT"] + "?api_key=" + process.env["WF_API_KEY"], "&centre_id=" + centreId + "&retailer_id=" + retailerId + "&fields=title%2Csubtitle%2Cdescription%2Cstores%2C_links&per_page=3&state=live", function(err, data) {
    if (err) {
      return callback(err)
    }

    return callback(err, data)
  })
}

var requestDeals = function (endpoint, queryString, callback) {
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
  getDealsByCentre : getDealsByCentre,
  getDealsByCentreByStore : getDealsByCentreByStore,
  getDealsByCentreByRetailer : getDealsByCentreByRetailer,
}
