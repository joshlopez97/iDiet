(function(){

  const unirest = require('unirest');
  // definition of fitbit for use in server.js
  function Fitbit(dependencies) {
    this.dependencies = dependencies;
    this.logged_in = false;
  }

  // Logging in and returning relevant information
  Fitbit.prototype.login = function(access_key, callback) {

    // Authentication 
    this.dependencies.unirest.post("https://api.fitbit.com/oauth2/token")
    .header("Content-Type", "application/x-www-form-urlencoded")
    .header("Authorization", "Basic MjJESzM5OjE3YTFmOTkyZjRjZTBhNmQ2ZWZiNzJlMDYyNzQxMTZk")
    .send("clientId=22DK39")
    .send("grant_type=authorization_code")
    .send(`code=${access_key}`)
    .send("redirect_uri=http%3A%2F%2F127.0.0.1%3A5000%2Fhome")
    .end(function (result) {

    // Generating and parsing date for input 
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    newdate = year + "-" + month + "-" + day;

    // Error Checks 
    if (result.status === 200)
    {
      console.log("FitBit Login success.")
      this.access_token = result.body.access_token;
      this.logged_in = true;
    }
    else
    {
      console.log("FitBit Login failed.");
      console.log(result.status, result.body);
    }

      // Extracting calories
       unirest.get("https://api.fitbit.com/1/user/-/activities/date/" + newdate + ".json")
      .header("Authorization", "Bearer " + result.body.access_token)
      .header("Content-Type", "application/x-www-form-urlencoded")
      .end(function (results) {

        // JSON Object that we will return with some garbage default vals
        let fitnessObj = {"totalCalories" : 1000000,
                          "totalSteps": 100000,
                          "totalDistance": 1000000};

        // Setting the values of the returned JSON Obj
        fitnessObj.totalCalories = results.body.summary.activityCalories;
        fitnessObj.totalSteps = results.body.summary.steps;
        fitnessObj.totalDistance = results.body.summary.distances[0].distance;

        return callback(fitnessObj);

      });
    });
  };


  exports.create = function(dependencies) {
    return new Fitbit(dependencies);
  };
})();