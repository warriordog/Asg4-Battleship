/*
    Web server code
*/

const express = require('express') // include express library

var port = 80;

var app = null;
var battleship = null;

// set port to listen on
exports.setPort = function(prt) {
    port = prt;
}

// Sets up the web server to start listening for connections
exports.setupServer = function(bship) {
    battleship = bship;
    
    // create an app
    app = express();
    
    // setup handlers
    app.get('/', (req, res) => res.send('Hello World!'))
    
    // listen for requests
    app.listen(port)
}
