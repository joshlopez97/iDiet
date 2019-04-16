(function(){
  function MockUnirest(result) {
    this.result = result;
  }

  function doNothing(a, b, c){
    return this;
  }

  MockUnirest.prototype.get = doNothing;

  MockUnirest.prototype.header = doNothing;

  MockUnirest.prototype.post = doNothing;

  MockUnirest.prototype.send = doNothing;

  MockUnirest.prototype.end = function(callback)
  {
    callback(this.result);
  };


  exports.create = function(dependencies) {
    return new MockUnirest(dependencies);
  };
}());