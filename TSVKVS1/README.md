# TSVKVS

This module provides KVS service using TSV format.

## Install

npm install tsvkvs

## Usage

Create a server for TSVKVS service. The constructor takes a filename for data storage.

    var TsvKvs = require('tsvkvs');
    var tkServer = new TsvKvs.Server('./data.tsv');
    var TsvKvsError = TsvKvs.Error;

The server object emits 2 events

    tkServer.on('connect', function() {}); // TsvKvs service is available
    tkServer.on('error' function(err) {}); // An error ocurred in the TsvKvs server

After connectiong, we can set/get a value

    var key = 'a';

    tk.set(key, 'test1', function(err, result) {
      if(err) {
        throw new TsvKvsError(err);
      }
      if(result){
        console.log('stored value for '+key);
      } else {
        console.log('not stored value for '+key);
      }
    });

    tk.get(key, function(err, result) {
      if(err) {
        throw new TsvKvsError(err);
      }
      if(result){
        console.log('got value for '+key);
      } else {
        console.log('got no value for '+key);
      }
    });

