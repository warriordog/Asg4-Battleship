/*
    Game logic
*/

// list of games that are currently active
var activeGames = {};

// next free id
var nextId = 0;

var battleship = null;

exports.setupEngine = function(bship) {
    battleship = bship;
}

exports.lookupPlayer = function(session) {
    if (session != null) {
        for (var game in activeGames) {
            var player = activeGames[game].playerList[session];
            if (player != undefined) {
                return player
            }
        }
    }
    
    return null;
}

exports.joinOrStartGame = function(gameName, playerName, maxPlayers) {
    // get or create game
    var game = activeGames[gameName];
    if (game == undefined) {
        game = new exports.Game(gameName, maxPlayers);
        activeGames[gameName] = game;
    }
    
    // make sure name is not taken
    for (var p in game.playerList) {
        if (game.playerList[p].name === playerName) {
            // name is in use
            return null;
        }
    }
    
    // add player
    var session = createNewSession();
    var player = new exports.Player(playerName, session, game);
    game.addPlayer(player);
    return session;
}

exports.Player = class {
    constructor(playerName, sessionId, game) {
        this.name = playerName;
        this.session = sessionId;
        this.game = game;
    }
    
    createPlayerBoard() {
        return {};
    }
}

exports.PlayerBoard = class {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
    }
}

exports.Board = class {
    constructor(game) {
        this.game = game;
        
        this.width = 5 * game.numPlayers;
        this.height = 5 * game.numPlayers;
    }
}

exports.Game = class {
    constructor(gameName, maxPlayers) {
        this.name = gameName;
        this.numPlayers = maxPlayers;
        
        this.playerList = {};
        this.gameState = 0; //0=starting, 1=ingame, 2=finished
    }
    
    addPlayer(player) {
        if (this.gameState == 0) {
            // add player to list
            this.playerList[player.session] = player;
            
            //TODO place ships
            
            // start game if everyone has joined
            if (Object.keys(this.playerList).length >= this.numPlayers) {
                this.startGame();
            }
        }
    }
    
    startGame() {
        this.gameState = 1;
    }
    
    endGame() {
        this.gameState = 2;
    }
};



function createNewSession() {
    var session = nextId.toString();
    nextId++;
    return session;
}
