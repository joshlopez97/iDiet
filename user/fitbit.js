(function(){

  // connecting MYSQL database, taken from mealsapi.js code
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'idiet.cqywkz4otd3h.us-east-2.rds.amazonaws.com',
    user: 'idiet',
    password: '1a2b3c4d5e',
    database: 'idiet'
  });

  // unirest needed for connection to fitbit api
  const unirest = require('unirest');

  // definition of fitbit for use in server.js
  function Fitbit(dependencies) {
    this.dependencies = dependencies;
    this.logged_in = false;
  }

  // method for logging in a fitbit account
  Fitbit.prototype.login = function(username, password) {
    // post for getting access token for a specified user
    unirest.post("https://FitbitAPIdimashirokovV1.p.rapidapi.com/getAccessToken")
    .header("X-RapidAPI-Key", "SIGN-UP-FOR-KEY")
    .header("Content-Type", "application/x-www-form-urlencoded")
    .send("clientId=USERNAME_WILL_GO_HERE")
    .send("code=ACCESS_GRANT_CODE")
    .send("clientSecret=PASSWORD_WILL_GO_HERE")
    .end(function (result) {
      console.log(result.status, result.headers, result.body);
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
  }

  // method for getting distance travelled for certain duration
  Fitbit.prototype.distance = function(duration) {
    if (this.logged_in) {
      // GET DISTANCE FOR GIVEN duration
    }
    else {
      // RETURN SOME ERROR MESSAGE
    }
    return 0;
  }

  exports.create = function(dependencies) {
    return new Fitbit(dependencies);
  };
})();
