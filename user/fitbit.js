(function(){

  // definition of fitbit for use in server.js
  function Fitbit(dependencies) {
    this.dependencies = dependencies;
    this.logged_in = false;
  }

  // method for logging in a fitbit account
  Fitbit.prototype.login = function(access_key) {
    // post for getting access token for a specified user
    this.dependencies.unirest.post("https://api.fitbit.com/oauth2/token")
    .header("Content-Type", "application/x-www-form-urlencoded")
    .header("Authorization", "Basic MjJESzM5OjE3YTFmOTkyZjRjZTBhNmQ2ZWZiNzJlMDYyNzQxMTZk")
    .send("clientId=22DK39")
    .send("grant_type=authorization_code")
    .send(`code=${access_key}`)
    .send("redirect_uri=http%3A%2F%2F127.0.0.1%3A5000%2Fhome")
    .end(function (result) {
      if (result.status === 200)
      {
        console.log("FitBit Login success.")
        console.log(`Obtained access_token '${result.body.access_token}'`)
        this.access_token = result.body.access_token;
        this.logged_in = true;
      }
      else
      {
        console.log("FitBit Login failed.");
        console.log(result.status, result.body);
      }
    });
    // IF LOGIN IS SUCCESSFUL
    // SET logged_in to true
    // ELSE IF LOGIN IS UNSUCCESSFUL
    // RETURN SOME ERROR MESSAGE
    return 0;
  };

  // method for getting calories burnt for certain duration
  Fitbit.prototype.calories = function(duration) {
    if (this.logged_in) {
      // GET CALORIES
    }
    else {
      // RETURN SOME ERROR MESSAGE  
    }
    return 0;
  };

  // method for getting distance travelled for certain duration
  Fitbit.prototype.distance = function(duration) {
    if (this.logged_in) {
      // GET DISTANCE FOR GIVEN duration
    }
    else {
      // RETURN SOME ERROR MESSAGE
    }
    return 0;
  };

  exports.create = function(dependencies) {
    return new Fitbit(dependencies);
  };
})();
