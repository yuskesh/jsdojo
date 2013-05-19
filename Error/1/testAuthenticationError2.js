var util = require('util');
var AuthenticationError = require('./AuthenticationError');

var ae = new AuthenticationError('ID or Password is wrong');

function callback(err) {
  if(err && err instanceof AuthenticationError){
    console.error('AuthenticaitonError ocurred');
    console.log(err.stack);
  }
}

callback(ae);
