var util = require('util');

function AuthenticationError(msg) {
    Error.call(this); // execute Error constructor
    this.message = msg || 'Authentication Error';
    this.name = 'AuthenticationError';
    Error.captureStackTrace(this, AuthenticationError);
}

util.inherits(AuthenticationError, Error);

module.exports = AuthenticationError;
