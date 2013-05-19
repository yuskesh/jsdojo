var domain = require('domain');
var d = domain.create();
d.on('error', function(err) {
  console.log('caught error: '+err);
});

d.run(function(){
  foo();
});

// other way to do it
// d.enter();
// foo();
// d.exit();

/* 
 * coud run till 0.8.9, but no more...
 * d.add(process);
 * foo();
 */
