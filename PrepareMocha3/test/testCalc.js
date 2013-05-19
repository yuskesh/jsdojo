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
    this.timeout(3000);
    setTimeout(function(){
      assert.equal(1+1, 2);
      done();
    }, 2001);
  });
  test.only('test 1+2', function(){
    assert.equal(1+2, 3);
  });
  test.skip('test 1+3', function(){
    assert.equal(1+3, 4);
  });
});
