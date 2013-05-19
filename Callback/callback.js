function callback(err, result) {
  if(err) {
      // handle the error here
      console.error(err);
      return;
  }
  // handle result here
  console.log(result);
}

function hello(arg, cb){
  if(arg == 1){
    cb(new Error('error here'));
    return;
  }
  cb(null, 'hello!');
}

hello(1, callback);
hello(2, callback);
