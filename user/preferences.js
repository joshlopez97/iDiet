(function() {

  function Preferences(dependencies) {
    this.connection = dependencies.connection;
  }

  Preferences.prototype.likeMeal = function(email, mid, callback)
  {
    this.connection.query(`INSERT into Likes(email, mid) values(?, ?)`, [email, mid], callback);
  };

  Preferences.prototype.dislikeMeal = function(email, mid, mindex, callback)
  {
    this.connection.query(`INSERT into Dislikes(email, mid) values(?, ?)`, [email, mid], callback);
  };

  exports.create = function(dependencies) {
    return new Preferences(dependencies);
  };
}());