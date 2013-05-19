
function asyncFunc() {
  setTimeout(function(){
    throw new Error('error!');
  },1);
}

function asyncTryCatch() {
  try {
    asyncFunc();
  } catch (error) {
    console.log('Caught: ' + error); // can't handle the thrown error.
  }
}

asyncTryCatch();
