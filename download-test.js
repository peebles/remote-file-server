// test the upload server doing a download
//
// 1.  Create a config.json in cwd with
//
// { "fileserver": { "classname": ... }
//
// 2.  node download-test.js <root> <some-file>
//
var config = require( './config.json' );
var fileServer = require( './index' )( config.fileserver );
fileServer.get( process.argv[2], process.argv[3], function( err, rs ) {
  if ( err ) {
    console.trace( err );
    process.exit(1);
  }
  rs.pipe( process.stdout );
});
