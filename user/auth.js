(function() {
  // Connecting MYSQL Database
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'idiet.cqywkz4otd3h.us-east-2.rds.amazonaws.com',
    user: 'idiet',
    password: '1a2b3c4d5e',
    database: 'idiet'
  });

  connection.connect(function(err){
    if(!err) {
      console.log("Database is connected");
    } else {
      console.log("Error connecting database");
    }
  exports.authenticate = function(email, password, callback) {
    console.log("authenticating");
    connection.query('SELECT * FROM Account WHERE Email = ?', [email], function(error, results, fields){
      if (error)
      {
        console.log("error occurred", error);
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

  exports.verify_user_info = function(user_info) {
    console.log("validating user info");

    return true;
  };

  exports.create_user = function(user_info) {
    // Inserting Post Request
    const sql = `INSERT into Account(Email, UserPassword, FirstName, Height, Weight, Age, LastName, Phone, Email) 
                values ('${user_info.username}', '${user_info.password}', '${user_info.firstname}', '${user_info.height}', '${user_info.weight}', '${user_info.age}', '${user_info.lastname}', '${user_info.phone}', '${user_info.email}')`;
    console.log(sql);
    connection.query(sql, (err) => {
      if(err) throw err;
      console.log(sql);
    });
  };

}());