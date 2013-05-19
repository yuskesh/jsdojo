var assert = require('assert');
var util = require('util');

suite('SampleTestSuite', function(){ 
  suiteSetup(function(done) {
    done();
  });
  setup(function(done){
    done();
  });
  teardown(function(done){
    done();
  });
  suiteTeardown(function(done) {
    done();
  });
  test('test 1+1', function(done){
    assert.equal(1+1, 2);
    done();
  });
  test('test 1+2');
  test('test 1+3');
});
