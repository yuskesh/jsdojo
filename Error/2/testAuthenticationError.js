var util = require('util');
var AuthenticationError = require('./AuthenticationError');

try {
  var ae = new AuthenticationError('ID or Password is wrong');
  throw ae;
} catch (e) {
  if(e.name && e.name === 'AuthenticationError') {
    console.error('AuthenticaitonError ocurred');
    console.error(e.stack);
  }
}
