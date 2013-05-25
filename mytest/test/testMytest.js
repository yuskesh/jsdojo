var assert = require('assert'),
    util = require('util');
var mytest = require('../index.js');

suite('mytestTestSuite', function(){ 
  test('test hasRunner');
  test('Runner class has run method');
  test('run method accepts any object');
  test('run method extract all functions and objects named begin with test but not test');
  test('run method extract sub-object');
  test('run method run unit tests');
  test('run method return a number of failed tests');
  test('run method make list of test result');
});
