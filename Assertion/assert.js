var assert = require('assert');

var a = 1;
var b = "ok";
var c = null;
var d = 1;
var e = "nok";

assert.throws(
  function() {
    try {
      assert.ok(a);
      assert.ok(b);
      assert.ok(c); // throws
    } catch (error) {
      console.log('error: ' + error);
      throw error;
    }
  }
);

assert.throws(
  function() {
    try {
      assert.equal(a, 1);
      assert.deepEqual(a, 1);
      assert.strictEqual(a, 1);
      assert.equal(a, "1");
      assert.deepEqual(a, "1");
      assert.strictEqual(a, "1"); // throws
    } catch (error) {
      console.log('error: ' + error);
      throw error;
    }
  }
);

function passError(cb) {
  cb(new Error('toss'), "result");
  return;
}

function catchError(error, result) {
  assert.throws(function() {
    try {
      assert.ifError(error); // trhows
    } catch (e) {
      console.log('error: ' + e);
      throw e;
    }
  });
}

passError(catchError);
