// include game module
const game = require("./game.js");

// include http module
const http = require("./http.js");

exports.getGame = function() {
    return game;
}
exports.getHttp = function() {
    return http;
}

// setup engine
game.setupEngine(this);

// setup server
http.setPort(8080);
http.setupServer(this);


