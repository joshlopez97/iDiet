(function() {

  function Account(dependencies) {
    this.dependencies = dependencies;
  }

  function convert_to_inches(height_string) {
    try {
      const heightRegex = /^([1-9]) ' ([0-9]|1[01])$/;
      const matches = heightRegex.exec(height_string),
        feet = parseInt(matches[1]),
        inches = parseInt(matches[2]);
      return (feet * 12) + inches;
    }
    catch (exception) {
      return 0;
    }
  }

  /**
   * Calculates number of suggested daily calories
   */
  Account.prototype.calculate_calories = function(email, callback)
  {
    this.dependencies.connection.query(`SELECT * FROM Account WHERE Email = '${email}';`,
      function(err, resp){
        if (err)
          throw err;
        console.log(resp);
        return callback(2000);
      });
  };

  /**
   * Checks whether or not an account exists
   */
  Account.prototype.account_exists = function(email, callback)
  {
    console.log(`Checking for existence of ${email}`);
    this.dependencies.connection.query(`SELECT * FROM Account WHERE Email = ?`,[email],
      function(err, resp){
        if (err)
          throw err;
        let result = resp.length > 0;
        console.log(`Result: ${result}`);
        return callback(result);
      });
  };

  /**
   * Authenticates username and password
   */
  Account.prototype.authenticate = function(email, password, callback) {
    console.log(`Authenticating ${email}`);
    this.account_exists(email, function(results){
      if (results.length > 0)
      {
        if (results[0].UserPassword === password)
        {
          console.log("Login success");
          return callback(true);
        }
        else
        {
          console.log("Wrong credentials");
          return callback(false);
        }
      }
      else
      {
        console.log("User does not exist");
        return callback(false);
      }
    });
  };

  /**
   *  Verifies user_info and returns list of problems found (if any).
   *
   *  The list returned by this function contains the names of all fields
   *  that have INVALID values. These values are checked against regex
   *  expressions stored in the `validators` dictionary. If the input is
   *  valid, an empty list is returned.
   */
  Account.prototype.verify_user_info = function(user_info) {
    const validators = {
      "email":/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i,
      "password":/.+/,
      "firstname":/^[a-z ,.'-]+$/i,
      "height":/^[1-9] ' ([0-9]|1[01])$/,
      "weight":/^[0-9]{2,}$/,
      "goalWeight":/^[0-9]{2,}$/,
      "budget":/^\$[0-9]+\.[0-9]{2}$/,
      "age":/^[0-9]{2,}$/
    };
    let problems = [];
    for (let field in user_info)
    {
      if (field in validators)
      {
        if (!user_info[field].match(validators[field]))
          problems.push(field);
      }
    }

    return problems;
  };

  Account.prototype.create_user = function(user_info) {

    // Convert numerical values to ints
    const height     = user_info.height = convert_to_inches(user_info.height),
          age        = parseInt(user_info.age),
          weight     = parseInt(user_info.weight),
          goalWeight = parseInt(user_info.goalWeight),
          budget     = Math.round(parseFloat(user_info.budget.replace("$", "")));

    // Inserting Post Request
    const sql = `INSERT into Account(Email, UserPassword, FirstName, Height, Weight, Age, Allergies, WeeklyBudget, GoalWeight, DailyCalories, FitBitConnected) 
                values ('${user_info.email}', '${user_info.password}', '${user_info.firstname}', ${height}, ${weight}, ${age}, NULL, ${budget}, ${goalWeight}, 0, 0)`;
    console.log(sql);
    this.dependencies.connection.query(sql, (err) => {
      if(err) throw err;
    });
  };

  exports.create = function(dependencies) {
    return new Account(dependencies);
  };

}());