var express = 	  require('express');
var path = require('path');

var buildFolder = path.dirname(__dirname)+'/boilerplate/build';

module.exports = {
	init: function(port){
		var commonServer = express();
  
		commonServer.get('/', function(req, res) {
			res.sendFile(buildFolder+'/www/index.html');
		});

		commonServer.use(express.static(buildFolder+'/www'));
		
        return commonServer.listen(port);
	}

}