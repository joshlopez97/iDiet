const assert = require('assert');
const expect = require('chai').expect;
const mockUnirestModule = require('./mock/mockunirest.js');
const fitbitModule = require('../health/fitbit.js');
const mockAccountModule = require('./mock/mockaccount.js')

describe('Fitbit.prototype.login', function () {
  it('Should log user into FitBit and return FitBit data into callback function.', function () {
    const mockResponse = {
      "status": 200,
      "body": {
        "access_token": 0,
        "summary": {
          "activityCalories": 2000,
          "steps": 500,
          "distances": [{"distance": 500}]
        }
      }
    };

    const fitbit = fitbitModule.create({
      "unirest": mockUnirestModule.create(mockResponse),
      "account": mockAccountModule.create()
    });

    fitbit.login("test@test.com", "testpassword", function(response){
      expect(response.result).to.be.equal('success');
      expect(response.data.totalCalories).to.be.equal(mockResponse.body.summary.activityCalories);
    });

  });
});