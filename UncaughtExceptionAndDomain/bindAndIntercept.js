var fs = require('fs'),
    util = require('util'),
    domain = require('domain');

var d = domain.create();

d.on('error', function(err) {
  console.log('caught an error: ' + util.inspect(err));
});

// bind
fs.readFile('./noexist.txt', 'utf-8', d.bind(function(err, data) {
  if (err) {
    throw err;
  }
  console.log(data);
}));

// intercept
fs.readFile('./noexist2.txt', 'utf-8', d.intercept(function(err, data) {
  console.log(data);
}));
