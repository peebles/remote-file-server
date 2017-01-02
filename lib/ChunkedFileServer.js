var request = require( 'request' );

module.exports = function( config ) {
  var request = require( 'request' );
  
  function upload( readableStream, filename, root, cb ) {
    
    var m = require('stream-meter')();

    // make sure the remote file path is relative
    filename = filename.replace( /^[\.\/]+/, '' );
    
    // this is the only way to make request NOT do a basename() on the filename
    var multiPart = [
      {
        'Content-Disposition': 'form-data; name="category"',
        body: root
      },
      {
        'Content-Disposition': 'form-data; name="file"; filename="' + filename + '"',
        'Content-Type': 'text/csv',
        body: readableStream.pipe(m)
      },
    ];

    request({
      uri: '/',
      baseUrl: config.url,
      method: 'POST',
      multipart: multiPart,
      headers: { 'content-type': 'multipart/form-data' }
    }, function( err, res, body ) {
      if ( err ) return cb( err );
      if ( res.statusCode != 200 )
	return cb( new Error( res.statusMessage ) );
      cb( null, m.bytes, body );
    });
  }

  function listing( root, prefix, cb ) {
    if ( ! cb ) {
      cb = prefix;
      prefix = null;
    }
    request({
      uri: '/dir',
      baseUrl: config.url,
      qs: { category: root, prefix: prefix },
      method: 'GET',
    }, function( err, res, body ) {
      if ( err ) return cb( err );
      if ( res.statusCode != 200 )
	return cb( new Error( res.statusMessage ) );
      cb( null, JSON.parse( body ) );
    });
  }

  function remove( root, filename, cb ) {
    request({
      uri: encodeURIComponent(filename),
      baseUrl: config.url,
      qs: { category: root },
      method: 'DELETE',
    }, function( err, res, body ) {
      if ( err ) return cb( err );
      if ( res.statusCode != 200 )
	return cb( new Error( res.statusMessage ) );
      cb( null, null );
    });
  }

  function get( root, filename, cb ) {
    cb( null, request({
      uri: encodeURIComponent(filename),
      baseUrl: config.url,
      qs: { category: root },
      method: 'GET',
    }));
  }

  return {
    upload: upload,
    listing: listing,
    remove: remove,
    get: get,
  };
};

