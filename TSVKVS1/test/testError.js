var assert = require('assert');
var util = require('util');

var TsvKsvError = require('../index').Error;

suite('Test Error', function(){ 
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
  test('test TsvKsvError name', function(){
    var tkError = new TsvKsvError('error ocurred');
    tkError.name = 'TsvKsvError';
  });
  test('test TsvKsvError name', function(){
    var tkError = new TsvKsvError('error ocurred');
    tkError.name = 'TsvKsvError';
  });
});
