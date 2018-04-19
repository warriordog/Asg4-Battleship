/*
    Web server code
*/

const express = require('express') // include express library
const bodyParser = require('body-parser') // you need a DIFFERENT library to get the request data out of express

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
    
    // enable receiving request data
    app.use(bodyParser.raw({inflate: true, limit: '100kb', type: '*/*'}));
    
    /*
    setup handlers
    */
    
    // handler for static pages
    app.use(express.static(staticDir));
    // redirect to main page
    app.get('/', (req, res) => res.redirect(mainPage));
    
    // start the game
    app.post('/api/start', function(req, res) {
        var json = parseAndCheckJSON(req, res);
        if (json != null) {
            var numPlayers = json.numPlayers;
            if (numPlayers >= 2 && numPlayers <= 8) {
            
                var response = {};
                response.session = battleship.getGame().joinOrStartGame(json.gameCode, json.playerName, json.numPlayers);
                if (response.session != null) {
                    sendOKResponse(res, response);
                } else {
                    sendResponse(res, 1, 'game name is in use', response)
                }
            } else {
                sendResponse(res, 2, 'invalid number of players', {session: null});
            }
        }
    });
    // get game status
    app.post('/api/status', function(req, res) {
        var json = parseAndCheckJSON(req, res);
        if (json != null) {
            var player = getAndCheckPlayer(json, res);
            if (player != null) {
                var response = {};
                response.state = player.game.gameState;
                response.players = createPlayerList(player.game);
                response.board = player.game.board.getAnonymousView();
                response.client = createClientSection(player);
                
                sendOKResponse(res, response);
            }
        }
    });
    // fire a shot
    app.post('/api/fire', function(req, res) {
        
    });
    // end the game
    app.post('/api/end', function(req, res) {
        
    });
}

// start listening
exports.start = function() {
    // listen for requests
    app.listen(port);
}

/*
 API functions
 */

// converts a request to JSON and validates structure
function parseAndCheckJSON(req, res) {
    try {
        var json = JSON.parse(req.body);
        if (json.hasOwnProperty('session')) {
            return json;
        }
    } catch (e) {
        // ignore JSON errors
    }
    
    // return null on errors
    sendResponse(res, -1, 'bad json', {});
    return null;
}
 
// checks if a request has a valid session, and if so gets the player object from it.  Otherwise sends error and returns null
function getAndCheckPlayer(json, res) {
    var session = json.session;
    if (session != null) {
        var player = battleship.getGame().lookupPlayer(session);
        if (player != null) {
            // user exists, so we can use it
            return player;
        }
    }
    
    // return null and send error with any problem
    sendResponse(res, 1, 'invalid session', {});
    return null;
}

// sends a properly-structured json response
function sendResponse(res, code, message, response) {
    var json = {status: {}};
    json.status.code = code;
    json.status.message = message;
    json.response = response;
    
    res.json(json);
}

// sends a properly-structured OK response
function sendOKResponse(res, response) {
    sendResponse(res, 0, 'OK', response);
}

function createPlayerList(game) {
    var list = [];
    for (var session in Object.keys(game.playerList)) {
        var player = game.playerList[session];
        list.push ({name: player.name, score: player.calculateScore()});
    }
    return list;
}

function createClientSection(player) {
    var client = {ships: []};
    for (var i = 0; i < player.ships.length; i++) {
        var ship = player.ships[i];
        var clientShip = {squares: [], sunk: ship.sunk};
        for (var j = 0; j < ship.squares.length; j++) {
            var square = ship.squares[j];
            var clientSquare = {x: square.x, y: square.y, contents: square.contents};
            
            clientShip.squares.push(clientSquare);
        }
        client.ships.push(clientShip);
    }
    return client;
}
