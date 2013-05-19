var EventEmitter = require('events').EventEmitter;
var util = require('util');

function AsyncFunc(){
  EventEmitter.call(this);
}

util.inherits(AsyncFunc, EventEmitter);

AsyncFunc.prototype.emitError = function() {
  var self = this;
  setTimeout(function() {
    self.emit('error', new Error('error ocurred'));
  },1);
};

AsyncFunc.prototype.throwError = function() {
  var self = this;
  setTimeout(function() {
    throw new Error('error thrown');
  },1);
};

var af = new AsyncFunc();
af.on('error', function(err){
  console.log('caught an emitted error: '+err);
});
af.emitError();

try {
  af.throwError();
} catch (err) {
  console.log('caught a thrown error: '+err);
}
