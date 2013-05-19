process.on('uncaughtException', function(err) {
  console.log('uncaughtException: '+err);
});

foo();
