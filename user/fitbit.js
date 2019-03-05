(function(){
  function Fitbit(dependencies) {
    this.dependencies = dependencies;
    this.logged_in = false;
  }

  Fitbit.prototype.login = function(username, password) {
    // IF LOGIN IS SUCCESSFUL
    // SET logged_in to true
    // ELSE IF LOGIN IS UNSUCCESSFUL
    // RETURN SOME ERROR MESSAGE
    return 0;
  };

  Fitbit.prototype.calories = function() {
    if (logged_in) {
      // GET CALORIES
    }
    else {
      // RETURN SOME ERROR MESSAGE  
    }
    return 0;
  }

  Fitbit.prototype.distance = function(interval) {
    if (logged_in) {
      // GET DISTANCE FOR GIVEN INTERVAL
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
