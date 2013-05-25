var util = require('util');
var path = require('path'),
    fs   = require('fs');

/**
 * Runner class
 */

function Runner(){
}


/**
 * Find test* functions in passed object.
 * 
 * @param {Object} tests
 * @api public
 */

Runner.prototype.run = function(tests) {
  for(var f in tests){
    if((/^test/).test(f) && typeof(tests[f] === 'function')) {
      // this seems to be the test
      tests[f]();
    }
  }
}

/**
 * Find test* files under specified directory and return the file paths
 *
 * @param {String} testDir
 * @api private
 *
 */

Runner.prototype.findTests = function(testDir) {
  if(!fs.existsSync(testDir)) {
    return;
  }
  return fs.readdirSync(testDir).filter(function(name) {
    return (/^test/).test(name);
  }).map(function(name) {
    return path.join(testDir, name);
  });
}

/*
 
var testDir = path.join(process.cwd(), 'test');
var testPaths = findTests(testDir);

// now read test files
testPaths.forEach(function(path){
  var tests = require(path);
  run(tests);
});
*/

exports.Runner = Runner;
