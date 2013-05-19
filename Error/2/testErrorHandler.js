var util = require('util');
var StorageError = require('./StorageError');
var AuthenticationError = require('./AuthenticationError');

var logger = console; // replace with your own logger

var se = new StorageError('DB doe\'snt respond');
var ae = new AuthenticationError('ID or password is wrong');

function errorHandler(err) {
  if(!err){
    return;
  }
  if(err instanceof StorageError){
    logger.error('can\'t access to storage');
  }
  if(err instanceof AuthenticationError){
    logger.info('Authenticatin Failed');
  }

  switch(err.type) {
    case 'critical':
      // Mail.to('you@example.com').body('Your app seems does\'nt work properly:\n'+err.stack).send();
      logger.error('critical error ocurred');
      break;
    case 'noncritical':
      logger.error('noncritical error ocurred');
      break;
    default:
      logger.error('unknown type error');
      logger.error(util.inspect(err));
      break;
  }
} 

errorHandler(se);
errorHandler(ae);
errorHandler(new Error('err!'));
