var EventEmitter = require('events').EventEmitter;

function asyncFunc() {
  var ee = new EventEmitter();
  setTimeout(function() {
    ee.emit('whoa');
    ee.emit('error');
  },1);
}

asyncFunc();
