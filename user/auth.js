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
      console.log("Database is connected ... nn");
    } else {
      console.log("Error connecting database ... nn");
    }
  });
  exports.authenticate = function(username, password) {
    console.log("authenticating");
    return true;
  };

  exports.verify_user_info = function(user_info) {
    console.log("validating user info");
    return true;
  };

  exports.create_user = function(user_info) {
    // Inserting Post Request
    const sql = `INSERT into Users(Username, UserPassword, FirstName, Height, Weight, Age) 
                values ('${user_info.username}', '${user_info.password}', '${user_info.firstname}', '${user_info.height}', '${user_info.weight}', '${user_info.age}')`;
    console.log(sql);
    connection.query(sql, (err) => {
      if(err) throw err;
      console.log(sql);
    });
  };

}());