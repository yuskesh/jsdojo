var assert = require('assert');


/**
 * return message you pass to this function
 *
 * @param {String} message
 * @return {String} helloMessage
 * @api public
 */

function hello(message) {
  var ms = message || 'Hello';
  return ms;
}

function testHello() {
  assert.equal(hello('YAY'), 'YAY');
}

exports.testHello = testHello;
