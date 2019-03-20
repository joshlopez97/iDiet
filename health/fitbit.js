(function(){
  // definition of fitbit for use in server.js
  function Fitbit(dependencies) {
    this.dependencies = dependencies;
  }

  // Logging in and returning relevant information
  Fitbit.prototype.login = function(email, access_key, callback) {

    const unirest = this.dependencies.unirest,
          account = this.dependencies.account;

    // Authentication 
    unirest.post("https://api.fitbit.com/oauth2/token")
    .header("Content-Type", "application/x-www-form-urlencoded")
    .header("Authorization", "Basic MjJESzM5OjE3YTFmOTkyZjRjZTBhNmQ2ZWZiNzJlMDYyNzQxMTZk")
    .send("clientId=22DK39")
    .send("grant_type=authorization_code")
    .send(`code=${access_key}`)
    .send("redirect_uri=http%3A%2F%2Flocalhost%3A5000%2F")
    .end(function (result) {

      // Generating and parsing date for input
      const dateObj = new Date(),
            month   = dateObj.getUTCMonth() + 1; //months from 1-12
            day     = dateObj.getUTCDate();
            year    = dateObj.getUTCFullYear();
            newdate = year + "-" + month + "-" + day;

      // Error Checks
      if (result.status === 200)
      {
        console.log("FitBit Login success.")
        this.access_token = result.body.access_token;
        unirest.get("https://api.fitbit.com/1/user/-/activities/date/" + newdate + ".json")
          .header("Authorization", "Bearer " + result.body.access_token)
          .header("Content-Type", "application/x-www-form-urlencoded")
          .end(function (results) {

            // JSON Object that we will return with some garbage default vals
            let fitnessObj = {};

            // Setting the values of the returned JSON Obj
            fitnessObj.totalCalories = Math.round(results.body.summary.activityCalories);
            fitnessObj.totalSteps = Math.round(results.body.summary.steps);
            fitnessObj.totalDistance = Math.round(results.body.summary.distances[0].distance);

            account.connect_fitbit(email, access_key, fitnessObj, function(){
              callback({"result": "success", "data": fitnessObj});
            });
          });
      }
      else
      {
        console.log("FitBit Login failed.");
        console.log(result.status, result.body);
        return callback({"result": "error", "data": {}})
      }
    });
  };


  exports.create = function(dependencies) {
    return new Fitbit(dependencies);
  };
})();