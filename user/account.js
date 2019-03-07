(function() {

  function Account(options, email) {
    this.options = options;
    this.email = email;
  }

  function convert_to_inches(height_string) {
    console.log(height_string);
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

  Account.prototype.account_exists = function(email, callback)
  {
    console.log(email);
    this.options.connection.query(`SELECT * FROM Account WHERE Email = ?`,[email],
      function(err, res){
        if (err)
          throw err;
        console.log(res);
        return callback(res.length > 0);
      });
  };

  Account.prototype.authenticate = function(email, password, callback) {
    console.log(`Authenticating ${email}`);
    this.options.connection.query(`SELECT * FROM Account WHERE Email = ?`, [email], function(error, results, fields){
      if (error)
      {
        console.log("Error occurred:\n", error);
      }
      else
      {
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
    const height = user_info.height = convert_to_inches(user_info.height),
          age    = parseInt(user_info.age),
          weight = parseInt(user_info.weight);

    // Inserting Post Request
    const sql = `INSERT into Account(Email, UserPassword, FirstName, Height, Weight, Age, Allergies) 
                values ('${user_info.email}', '${user_info.password}', '${user_info.firstname}', ${height}, ${weight}, ${age}, NULL)`;
    console.log(sql);
    this.options.connection.query(sql, (err) => {
      if(err) throw err;
      console.log(sql);
    });
  };

  exports.create = function(options, email) {
    return new Account(options, email);
  };

}());