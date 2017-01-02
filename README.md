# Remote File Server

A client-side library for putting, getting, removing and listing files on a remove file server.  The
client-side library can be configured to use AWS S3, or a custom file server.  A custom file server is
also supplied here.

The idea is to provide a client with remote file upload/download which can use S3 in production and the
custom file server in test, or in an environment without access to S3.  The client code does not change,
only configuration changes.

## Usage

```javascript
var config = require( './config.json' );
var fileServer = require( 'remote-file-system' )( config.fileserver );
fileServer.upload( readableStream, "my-filename", "root-directory", function( err, bytes, url ) {
  if ( err ) exit( err );
  console.log( "uploaded file, size:", bytes, "native url:", url );
  exit();
});
```

By simply supplying different configuration, this can work with S3 or with the (supplied) custom file server.

## Methods

### upload( readableStream, pathname, root, function( err, bytes, url ) )

`readableStream is the file content.  `pathname` is a relative path/filename of where you want to store the
file, which will go under `root`.  For example, if `pathname` is "images/img.png" and `root` is "my-uploads"
then the file will be stored on the file server as "my-uploads/images/img.png".  When using S3 as the file server,
then "my-uploads" is the bucket and "images/img.png" is the key.  For S3, the "my-uploads" buckey must already exist.

The callback will return an error, or the number of bytes uploaded and the native url where this file was stored.

### listing( root, [prefix,] function( err, listing ) )

The `listing` result will be an array of { name:, size: }.  The `prefix` acts like the S3 documented "Prefix"
parameter.  That is, you always get a recursive listing of files from `root` (a bucket) and if prefix is non-null,
only those files (keys) that begin with `prefix`.

### remove( root, filename, function( err ) )

Remove the remote file.

### get( root, filename, function( err, readableStream ) )

Get a file.  The `readableStream` is the file content.

## Custom File Server

You can run the following for a local file server instead of using S3:

```bash
env PORT=3000 BASEPATH=/tmp TRACE=1 node file-server.js
```

## Configuration

Please look at "config-example.json" for configuration details.

