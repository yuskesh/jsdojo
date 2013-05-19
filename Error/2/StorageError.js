var util = require('util');

function StorageError(msg) {
    Error.call(this); // execute Error constructor
    this.message = msg || 'Storage Error';
    this.name = 'StorageError';
    this.type = 'critical';
    Error.captureStackTrace(this, StorageError);
}

util.inherits(StorageError, Error);

module.exports = StorageError;
