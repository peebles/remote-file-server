module.exports = function( config ) {
  var AWS      = require('aws-sdk');
  AWS.config.update( config.creds );
  var s3Stream = require('s3-upload-stream')(new AWS.S3());

  function upload( readableStream, filename, root, cb ) {
    var m = require('stream-meter')();
    // make sure the remote file path is relative
    filename = filename.replace( /^[\.\/]+/, '' );
    var upload = s3Stream.upload({
      "Bucket": root,
      "Key": filename
    });
    upload.on('error', function (err) {
      cb( err );
    });
    upload.on('uploaded', function ( details ) {
      cb( null, m.bytes, details.Location );
    });
    readableStream.pipe(m).pipe( upload );
  }

  function listing( root, cb ) {
    var s3 = require( 's3' );
    client = s3.createClient({
      s3Options: config.creds
    });
    var lister = client.listObjects({
      s3Params: { Bucket: root, MaxKeys: 1000 },
    });
    var datas = [];
    lister.on( 'error', function( err ) {
      cb( err );
    });
    lister.on( 'data', function( data ) {
      datas.push( data );
    });
    lister.on( 'end', function() {
      var data = datas[0];
      cb( null, data.Contents.map( function( item ) {
	return { name: item.Key, size: item.Size };
      }));
    });
  }

  function remove( root, filename, cb ) {
    var s3 = require( 's3' );
    client = s3.createClient({
      s3Options: config.creds
    });
    var remover = client.deleteObjects({
      Bucket: root,
      Objects: [{ Key: filename }]
    });
    remover.on( 'error', cb );
    remover.on( 'end', cb );
  }

  function get( root, filename, cb ) {
    var s3 = require( 's3' );
    client = s3.createClient({
      s3Options: config.creds
    });
    var readableStream = client.downloadStream({
      Bucket: root,
      Key: filename
    });
    cb( null, readableStream );
  }

  return {
    upload: upload,
    listing: listing,
    remove: remove,
    get: get,
  };
};

