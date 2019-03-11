(function() {

  function Account(dependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Helper function converts height string (Ex: "5 ' 1")
   * to int containing height in inches
   */
  function convert_to_inches(height_string) {
    try {
      const heightRegex = /^([1-9]) ' ([0-9]|1[01])$/;
      const matches = heightRegex.exec(height_string),
        feet = parseInt(matches[1]),
        inches = parseInt(matches[2]);
      return (feet * 12) + inches;
    }
    catch (exception) {
      console.log("Something went wrong converting height");
      return -1;
    }
  }

  /**
   * Returns calculated daily calories and weekly budget, external function for Account module
   */
  Account.prototype.getTargetCaloriesAndBudget = function(email, callback)
  {
    return calculateCalories(email, this.dependencies.connection, callback);
  };

  /**
   * TODO: This function needs to calculated recommended daily calories based on height, weight, age, goalweight, and FitBit data
   * Calculates number of suggested daily calories
   */
  function calculateCalories(email, connection, callback)
   {
     connection.query(`SELECT * FROM Account WHERE Email = ?`,[email],
       function(err, resp){
         let account_info = resp[0];
         
    // Harris-Benedict Equation BMR Calculation
    let height = account_info.Height;
    let weight = account_info.Weight;
    let age = account_info.Age;
    
    // let gender = account_info.Gender; // Need to add, but assume everyone a male right now.
    // let activityFactor = account_info.activityFactor; // Need to add, but assume everyone is moderately active right now.
    // let activityMultiplier = 0;
    
    /* Multipliers For activityFactor
    - Will be added when functionality for gender and activity factor implemented.

    //Sedentary activity
    if (activityFactor == 1)
      activityMultiplier = 1.2;
    //Lightly active
    else if (activityFactor == 2)
      activityMultiplier = 1.375;
    //Moderately active
    else if (activityFactor == 3)
      activityMultiplier = 1.55;
    //Very Active
    else if (activityFactor == 4)
      activityMultiplier = 1.725*/

    /* Mifflin-ST JEOR equation for BMR
      Male: 10 * weight(kg) + 6.25 * height(cm) - 5 * age (y) + s (+5 for males)
      Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age (y) + s (-161 for females) */

    // Store calculated recommended daily calories in SQL table
    /*
    if (account_info.Gender === Male)
    {
      let BMR = (10 * weight) + (6.25 * height) - (5 * age) + 5
    }
    else
    {
      let BMR = (10 * weight) + (6.25 * height) - (5 * age) - 161
    }
    */
    let BMR = 66 + (6.2 * weight) + (12.7 * height) - (6.76 * age);
    
    let calculatedCalories = BMR * 1.3; // BMR * activityMultiplier once implemented

         connection.query(`
           UPDATE Account
             SET DailyCalories=${calculatedCalories}
           WHERE Email='${email}';
         `, function(err, resp){
           // Return calories and budget back as callback parameter
           callback(calculatedCalories, account_info.WeeklyBudget);
       });
     });
   }

  /**
   * Connects FitBit to account
   */
  Account.prototype.connect_fitbit = function(email, access_key, fitbit_data, callback)
  {
    const connection = this.dependencies.connection;
    connection.query(`
      UPDATE Account
        SET FitBitConnected=1
      WHERE Email='${email}'
    `, function(err, resp){
      if (resp.changedRows === 0)
      {
        console.log("FitBit already connected");
        callback(err, resp);
      }
      else
      {
        connection.query(`
        INSERT into FitBit(email, accessKey, caloriesBurned, steps, distance)
          values('${email}', '${access_key}', ${fitbit_data.totalCalories}, ${fitbit_data.totalSteps}, ${fitbit_data.totalDistance});
        `, callback);
      }
    })
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
    let connection = this.dependencies.connection;
    connection.query(`SELECT * FROM Account WHERE Email = ?`,[email], function(err, results){
      console.log(results);
      if (results.length > 0)
      {
        if (results[0].UserPassword === password)
        {
          console.log("Login success");
          calculateCalories(email, connection, function(err, resp){
            return callback(true);
          });
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

  Account.prototype.get_account_info = function(email, callback) {
    console.log('Getting account info for ' + email);
    let connection = this.dependencies.connection;
    connection.query(`SELECT * FROM Account WHERE Email = ?`,[email], function(err, resp){
      if (err) throw err;
      if (resp.length > 0)
      {
        let account_info = resp[0];
        delete account_info.UserPassword;
        if (account_info.FitBitConnected)
        {
          connection.query(`SELECT * FROM FitBit WHERE email = ?`, [email], function(err, fitbit_info){
            if (err) throw err;
            if (fitbit_info.length > 0)
            {
              Object.assign(account_info, fitbit_info[0]);
            }
            return callback(account_info);
          })
        }
        else
        {
          return callback(account_info);
        }
      }
      else
      {
        return callback({});
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