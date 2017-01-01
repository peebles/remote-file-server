// test the upload server
//
// 1.  Create a config.json in cwd with
//
// { "fileserver": { "classname": ... }
//
// 2.  node upload-test.js <some-file> <root>
//
var config = require( './config.json' );
var fileServer = require( './index' )( config.fileserver );
var rs = require( 'fs' ).createReadStream( process.argv[2] );
fileServer.upload( rs, require( 'path' ).basename( process.argv[2] ), process.argv[3], function( err, bytes, url ) {
  if ( err ) {
    console.trace( err );
    process.exit(1);
  }
  console.log( 'upload successful.  bytes uploaded:', bytes, 'url:', url );
});
