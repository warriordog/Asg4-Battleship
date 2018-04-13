/*
    Web server code
*/

const express = require('express') // include express library

var port = 80;
var staticDir = 'web';
var mainPage = '/index.html';

var app = null;
var battleship = null;

// set port to listen on
exports.setPort = function(prt) {
    port = prt;
}

// set root web directory
exports.setStaticDirectory = function(staticDirectory) {
    staticDir = staticDirectory;
}

// set main page
exports.setMainPage = function(mainUrl) {
    mainPage = mainUrl;
}

// Sets up the web server to start listening for connections
exports.setupServer = function(bship) {
    battleship = bship;
    
    // create an app
    app = express();
    
    // setup handlers
    // handler for static pages
    app.use(express.static(staticDir));
    // redirect to main page
    app.get('/', (req, res) => res.redirect(mainPage));
    
    // listen for requests
    app.listen(port);
}
