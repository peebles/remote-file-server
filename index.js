var path = require( 'path' );
module.exports = function( config ) {
  var classname = config.classname;
  var pkg = require( path.join( __dirname, 'lib', classname ) )( config.options );
  return pkg;
}
