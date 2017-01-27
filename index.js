/**
 * App ID for the skill
 */
var APP_ID = "amzn1.ask.skill.924c6c93-dee3-4148-9e12-a6e40fd7c1e3"; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var dealerService = require('./dealer');
var eventsService = require('./events');
var stripTags = require('./strip-tags');
var constants = require('./constants');

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * Westfield is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Westfield = function() {
  AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Westfield.prototype = Object.create(AlexaSkill.prototype);
Westfield.prototype.constructor = Westfield;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

Westfield.prototype.eventHandlers.onSessionStarted = function(sessionStartedRequest, session) {
  console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
  // any initialization logic goes here
};

Westfield.prototype.eventHandlers.onLaunch = function(launchRequest, session, response) {
  console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
  handleWelcomeRequest(response);
};

Westfield.prototype.eventHandlers.onSessionEnded = function(sessionEndedRequest, session) {
  console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);
  // any cleanup logic goes here
};

/**
 * override intentHandlers to map intent handling functions.
 */
Westfield.prototype.intentHandlers = {
  "OneShotIntent": function(intent, session, response) {
    handleOneShotRequest(intent, session, response);
  },

  "SupportedCentresIntent": function(intent, session, response) {
    handleSupportedCentresRequest(intent, session, response);
  },

  "DialogIntent": function(intent, session, response) {
    var centre = session.attributes.centre || getCentreFromIntent(intent);
    var typeVal = session.attributes.type || getTypeFromIntent(intent);
    if (!typeVal.error) {
      session.attributes.type = typeVal;
    }
    if (!centre.error) {
      session.attributes.centre = centre;
    }

    if (centre.error && typeVal.error) {
      handleHelpRequest(response);
      return;
    }

    if (centre.error) {
      handleSupportedCentresRequest(intent, session, response);
      return;
    }
    handleSupportedTypesRequest(intent, session, response);
  },

  "AIIntent": function(intent, session, response) {
    response.tell("Well, in the end the A.I. always wins.");
  },

  "PretzelIntent": function(intent, session, response) {
    response.tell("Wetzel's Pretzels is the best! You can find it in the basement level of San Francisco center.");
  },

  "EventsIntent": function(intent, session, response) {
    var centre = session.attributes.centre || getCentreFromIntent(intent);
    handleEventRequest(centre, response);
  },

  "DealsIntent": function(intent, session, response) {
    var centre = session.attributes.centre || getCentreFromIntent(intent);
    handleDealRequest(centre, response);
  },

  "RetailerDealsIntent": function(intent, session, response) {
    var centre = session.attributes.centre || getCentreFromIntent(intent);
    handleRetailerDealsRequest(centre, response);
  },

  "AMAZON.HelpIntent": function(intent, session, response) {
    handleHelpRequest(response);
  },

  "AMAZON.StopIntent": function(intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  },

  "AMAZON.CancelIntent": function(intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  }
};

// -------------------------- Westfield Domain Specific Business Logic --------------------------
var HTML_REGEX = /(<([^>]+)>)/ig;

function handleWelcomeRequest(response) {
  var repromptText = "What center can I help you with?";
  var speechText = "Welcome to Westfield Malls. " + repromptText;

  response.ask(speechText, repromptText);
}

function handleHelpRequest(response) {
  var repromptText = "What center can I help you with?";
  var speechText = "I can lead you through providing a center " + "or you can simply open Westfield and ask a question like, " + "get deals for San Francisco. Or, get events at World Trade Center. " + "Or you can say exit. " + repromptText;

  response.ask(speechText, repromptText);
}


function handleSupportedCentresRequest(intent, session, response) {
  var repromptText = "What center can I help you with?";
  var speechOutput = "Currently, I know information about these Westfield centers: " + getAllCentresText() + repromptText;

  response.ask(speechOutput, repromptText);
}

function handleSupportedTypesRequest(intent, session, response) {
  var centre = session.attributes.centre || getCentreFromIntent(intent);
  var typeVal = session.attributes.type || getTypeFromIntent(intent);
  if (typeVal.error) {
    var repromptText = "Say events or deals.";
    var speechOutput = "I can get you information on events or deals at " + centre.name + ". " + repromptText;

    response.ask(speechOutput, repromptText);
    return;
  }
  if (typeVal.name === "deals") {
    handleDealRequest(centre, response);
  } else if (typeVal.name === "events") {
    handleEventRequest(centre, response);
  }
}

function handleOneShotRequest(intent, session, response) {
  var centre = getCentreFromIntent(intent);
  if (centre.error) {
    var repromptText = "What center can I help you with?";
    var speechOutput = "I don't know about " + centre.name + ". " + "Currently, I know information about these Westfield centers: " + getAllCentresText() + repromptText;

    response.ask(speechOutput, repromptText);
    return;
  }
  var type = getTypeFromIntent(intent);
  if (type.error) {
    handleSupportedTypesRequest(intent, session, response)
    return
  }
  if (type.name == "deals") {
    handleDealRequest(centre, response);
  } else if (type.name == "events") {
    handleEventRequest(centre, response);
  }
}


function handleDealRequest(centre, response) {
  dealerService.getDealsByCentre(centre.id, function(err, data) {
    var speechText;
    if (err !== null) {
      speechText = "We had a problem looking up deals at " + centre.name + ". Please try again later. ";
    } else {
      speechText = "We found the following deals at Westfield " + centre.name + ": ";
      
      var deals = data.data;
      for (var i in deals) {
        console.log(deals[i]);

        var dealTitle = getTextFromHTML(deals[i].title);
        var dealDescription = getTextFromHTML(deals[i].description);

        var storeName = deals[i]._links.retailer.name;
        var location = deals[i].stores[0].locations[0].level_name;
        if (storeName) {
          speechText = speechText + "At " + storeName + ",";
        }
        speechText = speechText + " " + dealTitle;
        if (dealDescription) {
          speechText = speechText + ". " + dealDescription;
        }
        speechText = speechText + " Located at " + location;
      }
    }
    response.tell(speechText);
  });
}

function handleEventRequest(centre, response) {
  eventsService.getEventsByCenter(centre.id, function(err, data) {
    var speechText;
    if (err !== null) {
      speechText = "We had a problem looking up events at " + centre.name + ". Please try again later. ";
    } else {
      var events = data.data;

      speechText = "We found the following events at Westfield " + centre.name + ": ";
      
      for (var i in events) {
        var eventTitle = getTextFromHTML(events[i].name);
        var eventDescription = getTextFromHTML(events[i].description);
        speechText = speechText + " " + eventTitle;
        if (eventDescription) {
          speechText = speechText + ". " + eventDescription;
        }
      }
    }

    response.tell(speechText);
  });  
}


function handleRetailerDealsRequest(centre, response) {
  dealerService.getRetailerDealsByCentre(centre.id, function(err, data) {
    var speechText;
    if (err !== null) {
      speechText = "We had a problem looking up deals at " + centre.name + ". Please try again later. ";
    } else {
      speechText = "The following retailers are having sales at Westfield " + centre.name + ": ";
      
      var deals = data.data;
      var retailers = {}
      for (var i in deals) {
        var storeName = deals[i]._links.retailer.name;
        if (retailers[storeName]) {
          retailers[storeName]++;
        } else {
          retailers[storeName] = 1;
        }
      }
      var keysSorted = Object.keys(retailers).sort(function(a,b){return retailers[a]-retailers[b]})
      var max = 5;
      for (var i=keysSorted.length-1; i >=0; i--) {
        if (max != 5) {
          speechText = speechText + ", ";
        }
        speechText = speechText + " " + keysSorted[i] + " has " + retailers[keysSorted[i]];
        speechText = speechText + " deal";
        if (retailers[keysSorted[i]] > 1) {
          speechText = speechText + "s";
        }
        max--;
        if (max == 0) {
          break;
        }
      }
    }
    response.tell(speechText);
  });  
}


function getAllCentresText() {
  var centreList = '';
  for (var i in constants.CENTRE_NAMES) {
    centreList += constants.CENTRE_NAMES[i] + ", ";
  }
  return centreList;
}


function getCentreFromIntent(intent) {
  var centreSlot = intent.slots.Centre;
  // slots can be missing, or slots can be provided but with empty value.
  // must test for both.
  if (!centreSlot || !centreSlot.value) {
    return {
      error: true
    }
  } else {
    var centreName = centreSlot.value.replace("center", "").replace("centre", "").trim().toLowerCase();
    if (constants.CENTRES[centreName]) {
      var centerId = constants.CENTRES[centreName];
      if (centreName === "world trade") {
        centreName = "world trade center";
      }
      return {
        name: centreName,
        id: centerId
      }
    } else {
      return {
        error: true,
        name: centreName
      }
    }
  }
}

function getTypeFromIntent(intent) {
  var typeSlot = intent.slots.Type;
  // slots can be missing, or slots can be provided but with empty value.
  // must test for both.
  if (!typeSlot || !typeSlot.value) {
    return {
      error: true
    }
  } else {
    var typeName = typeSlot.value.toLowerCase();
    if (typeName == "events" || typeName == "deals") {
      return {
        name: typeName
      }
    } else {
      return {
        error: true,
        name: typeName
      }
    }
  }
}

function getTextFromHTML(val) {
  return stripTags(val).replace(/&nbsp;|[\r\n]/g," ").replace(/&([^;]+);/g, "");
}

// Create the handler that responds to the Alexa Request.
exports.handler = function(event, context) {
  var tidePooler = new Westfield();
  tidePooler.execute(event, context);
};
