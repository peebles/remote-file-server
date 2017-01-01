/*
   A reference implementation of a server that can accept POSTFileSystem file POSTs,
   store the incoming files somewhere and handle GETs to these files.

   Usage:

   env PORT=80 BASEPATH=/tmp TRACE=1 node file-server.js
   
 */
var express = require( 'express' );
var path = require( 'path' );
var os = require( 'os' );
var fs = require( 'fs' );
var Busboy = require( 'busboy' );
var mkdirp = require( 'mkdirp' );

var app = express();

// Where are files stored?

var basePath = process.env.BASEPATH || require( 'os' ).tmpdir();

if ( process.env.TRACE ) {
  app.use( function( req, res, next ) {
    console.log( req.method, req.path );
    next();
  });
}

// File uploads
//
// curl -F category=ca-ca -F file=@dist.zip http://localhost:3000
//
app.post( '/', function( req, res, next ) {
  var params = {};
  var tmpfile;
  var remoteFilename;

  function copy( src, target, cb ) {
    var rd = fs.createReadStream( src );
    rd.on( 'error', function( err ) { return cb( err ); } );
    var wr = fs.createWriteStream( target );
    wr.on( 'error', function( err ) { return cb( err ); } );
    wr.on('finish', function() { return cb(); } );
    rd.pipe( wr );
  }
  
  var busboy = new Busboy({ headers: req.headers, preservePath: true });

  busboy.on( 'field', function( name, val ) {
    params[ name ] = val;
  });

  busboy.on( 'file', function( name, fp, filename, encoding, mimetype ) {
    remoteFilename = filename;
    tmpfile = path.join( os.tmpdir(), path.basename( filename ) );
    fp.pipe( fs.createWriteStream( tmpfile ) );
  });

  busboy.on( 'finish', function() {
    var fullpath = path.join( basePath, params.category, remoteFilename );
    var dirname  = path.dirname( fullpath );
    mkdirp( dirname, function( err ) {
      if ( err ) return next( err );
      copy( tmpfile, fullpath, function( err ) {
	if ( err ) return next( err );
	fs.unlinkSync( tmpfile );
	var url = req.protocol + '://' + req.get( 'host' ) + '/' +
		  path.join( params.category, remoteFilename );
	res.status( 200 ).send( url );
      });
    });
  });

  req.pipe( busboy );
});

app.get( '/dir', function( req, res, next ) {
  var files = [];
  if ( ! fs.existsSync( path.join( basePath, req.query.category ) ) ) return res.json( [] );
  fs.readdir( path.join( basePath, req.query.category ), function( err, list ) {
    if ( err ) return next( err );
    if ( list && list.length ) {
      list.forEach( function( name ) {
	var stats = fs.statSync( path.join( basePath, req.query.category, name ) );
	if ( stats.isFile() && name[0] !== '.' ) {
	  files.push({
	    name: name,
	    size: stats.size,
	  });
	}
      });
    }
    res.json( files );
  });
});

// File downloads
//
// wget http://localhost:3000/ca-ca/dist.zip
//
app.get( '*', function( req, res, next ) {
  var filename = req.path;
  var fullname = path.join( basePath, filename );
  if ( req.query.category ) fullname = path.join( basePath, req.query.category, filename );
  // Used to set content-disposition, but that overrides any down stream proxy that is
  // trying to over write it!
  //res.setHeader( 'Content-disposition', 'attachment; filename=' + path.basename( fullname ) );
  if ( ! fs.existsSync( fullname ) )
    return res.status( 400 ).send( 'file does not exist' );

  var strm = fs.createReadStream( fullname );
  strm.pipe( res );
});

app.delete( '*', function( req, res, next ) {
  var filename = req.path;
  var fullname = path.join( basePath, filename );
  if ( req.query.category ) fullname = path.join( basePath, req.query.category, filename );
  fs.unlink( fullname, function( err ) {
    if (err) return res.status( 500 ).send( err.message );
    else res.status( 200 ).send( 'OK' );
  });
});

var port = process.env.PORT || 3000;
app.listen( port, function() {
  console.log( 'server listening on port ' + port );
});

