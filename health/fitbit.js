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
    .end(function (response) {

      // Generating and parsing date for input
      const dateObj = new Date(),
            month   = dateObj.getUTCMonth() + 1, //months from 1-12
            day     = dateObj.getUTCDate(),
            year    = dateObj.getUTCFullYear(),
            newdate = year + "-" + month + "-" + day;

      // Error Checks
      if (response.status === 200)
      {
        console.log("FitBit Login success.")
        this.access_token = response.body.access_token;

        // Get FitBit Data
        unirest.get("https://api.fitbit.com/1/user/-/activities/date/" + newdate + ".json")
          .header("Authorization", "Bearer " + response.body.access_token)
          .header("Content-Type", "application/x-www-form-urlencoded")
          .end(function (user_data) {
            let fitnessData = {};

            // Setting the values of the returned JSON Obj
            fitnessData.totalCalories = Math.round(user_data.body.summary.activityCalories);
            fitnessData.totalSteps = Math.round(user_data.body.summary.steps);
            fitnessData.totalDistance = Math.round(user_data.body.summary.distances[0].distance);

            account.connect_fitbit(email, access_key, fitnessData, function(){
              callback({"result": "success", "data": fitnessData});
            });
          });
      }
      else
      {
        console.log("FitBit Login failed.");
        console.log(response.status, response.body);
        return callback({"result": "error", "data": {}})
      }
    });
  };


  exports.create = function(dependencies) {
    return new Fitbit(dependencies);
  };
}());