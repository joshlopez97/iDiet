(function(){
  function MockAccount(result) {
    this.result = result;
  }

  MockAccount.prototype.connect_fitbit = function (email, access_key, fitbit_data, callback)
  {
    callback();
  };


  exports.create = function(dependencies) {
    return new MockAccount(dependencies);
  };
}());