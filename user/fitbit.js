(function(){
  function Fitbit(options) {
    this.options = options;
  }

  Fitbit.prototype.login = function(username, password) {
    return true;
  };

  exports.create = function(options) {
    return new Fitbit(options);
  };
}());