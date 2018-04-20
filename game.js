/*
    Game logic
*/
const util = require("./util.js")

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
        this.ships = [];
        this.nextShotTime = 0;
        this.defeated = false; // defeated when all ships sunk
        this.quit = false; // true if player calls api/end
        this.score = 0;
    }
    
    calculateScore() {
        //TODO
        return this.score;
    }
    
    generateShips() {
        // one ship in column sessionId in the first two rows
        //this.ships.push(this.game.board.createShip(this, [[parseInt(this.session), 0], [parseInt(this.session), 1]]));
        for(var i = 5; i > 0; i--){
            var l = i;
            if(i<3){
                l++;
            }
            var pass = false;
            while(!pass){
                var rx = Math.floor(Math.random()*(this.game.board.width-1));
                var ry = Math.floor(Math.random()*(this.game.board.height-1));
                var orientation = Math.floor(Math.random()*4);
                if(this.scan(rx, ry, orientation, l)){
                    this.fill(rx, ry, orientation, l);
                    pass = true;
                }
                else{
                    pass = false;
                }
            }
        }
    }
    
    scan(x, y, or, l){
        if(or==0){
            if(y+1>=l){
                for(var i=0; i<l; i++){
                    if(this.game.board.grid[x][y-i].contents != 0){
                        return false;
                    }
                }
                return true;
            }
        }
        else if(or==1){
            if((x+l)<=this.game.board.width){
                for(var i=0; i<l; i++){
                    if(this.game.board.grid[x+i][y].contents != 0){
                        return false;
                    }
                }
                return true;
            }
        }
        else if(or==2){
            if((y+l)<=this.game.board.height){
                for(var i=0; i<l; i++){
                    if(this.game.board.grid[x][y+i].contents != 0){
                        return false;
                    }
                }
                return true;
            }
        }
        else if(or==3){
            if(x+1>=l){
                for(var i=0; i<l; i++){
                    if(this.game.board.grid[x-i][y].contents != 0){
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }
    
    fill(x, y, or, l){
        var array = [];
        if(or==0){
            for(var i=0; i<l; i++){
                var coords = [x, y-i];
                array[i] = coords;
            }
        }
        else if(or==1){
            for(var i=0; i<l; i++){
                var coords = [x+i, y];
                array[i] = coords;
            }
        }
        else if(or==2){
            for(var i=0; i<l; i++){
                var coords = [x, y+i];
                array[i] = coords;
            }
        }
        else if(or==3){
            for(var i=0; i<l; i++){
                var coords = [x-i, y];
                array[i] = coords;
            }
        }
        var ship = this.game.board.createShip(this, array);
        this.ships.push(ship);
    }
 
    fireShot(x, y) {
        if (this.game.fireShot(x, y)) {
            this.score = this.score+100;
            //TODO increase score
            return true;
        } else {
            return false;
        }
    } 
 
    tickFireTimer() {
        var time = Math.floor(new Date() / 1000);
        if (time - this.nextShotTime > 1) {
            this.nextShotTime = time + 1;
            return true;
        }
        return false;
    }
    
    update() {
        this.defeated = true;
        if (!this.quit) {
            for (var i = 0; i < this.ships.length; i++) {
                var ship = this.ships[i];
                
                if (!ship.sunk) {
                    this.defeated = false;
                }
            }
        }
    }
    
    leaveGame() {
        this.quit = true;
        this.defeated = true;
        this.game.checkEndGame();
    }
}

exports.PlayerBoard = class {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = util.allocArray(width, height);
    }
}

exports.Board = class {
    constructor(game) {
        this.game = game;
        
        this.width = 5 * game.maxPlayers;
        this.height = 5 * game.maxPlayers;
        
        this.grid = util.allocArray(this.width, this.height);
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                this.grid[x][y] = new exports.Square(x, y);
            }
        }
    }
    
    createShip(player, locations) {
        var squares = [];
    
        // convert x,y to square pointers
        for (var i = 0; i < locations.length; i++) {
            var loc = locations[i];
            
            var x = loc[0];
            var y = loc[1];
            
            squares.push(this.grid[x][y]);
        }
        
        // create ship
        var ship = new exports.Ship(player, squares);
        
        // set pointers in squares
        for (var i = 0; i < squares.length; i++) {
            var square = squares[i];
        
            if (square.contents != 1) {
                square.contents = 1;
                square.ship = ship;
            } else {
                throw "Ships overlap!";
            }
        }
        
        return ship;
    }
    
    getAnonymousView() {
        var board = new exports.PlayerBoard(this.width, this.height);
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                board.grid[x][y] = this.grid[x][y].contents;
                if (board.grid[x][y] === 1) {
                    board.grid[x][y] = 0;
                }
            }
        }
        return board;
    }
    
    checkCoords(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
}

exports.Square = class {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.contents = 0;//0=empty, 1=ship_hidden, 2=ship_hit 3=ship_miss
        this.ship = null;
    }
};

exports.Game = class {
    constructor(gameName, maxPlayers) {
        this.name = gameName;
        this.maxPlayers = maxPlayers;
        this.numPlayers = 0;
        
        this.playerList = {};
        this.gameState = 0; //0=starting, 1=ingame, 2=finished
        this.board = new exports.Board(this);
    }
    
    addPlayer(player) {
        if (this.gameState == 0) {
            // add player to list
            this.playerList[player.session] = player;
            this.numPlayers++;
            
            player.generateShips();
            
            // start game if everyone has joined
            if (this.numPlayers >= this.maxPlayers) {
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
    
    fireShot(x, y) {
        var square = this.board.grid[x][y];
        if (square.contents === 1) {
            square.contents = 2; // hit
            
            // check for ship sunk
            square.ship.update();
            if (square.ship.sunk) {
            
                // check for defeat of player
                square.ship.player.update();
                if (square.ship.player.defeated) {
                
                    // check if player won
                    this.checkEndGame()
                }
            }
        
            return true;
        } else {
            square.contents = 3; // miss
            return false;
        }
    }
    
    checkEndGame() {
        var ended = true;
        for (var session in playerList) {
            var player = playerList[session];
            
            if (!player.defeated) {
                ended = false;
            }
        }
        
        if (ended) {
            this.gameState = 2;
        }
    }
    
    cleanup() {
        delete activeGames[this.name];
    }
};

exports.Ship = class {
    constructor(player, squares) {
        this.player = player;
        this.squares = squares;
        this.sunk = false;
    }
    
    update() {
        this.sunk = true;
        for (var i = 0; i < this.squares.length; i++) {
            var square = this.squares[i];
            if (square.contents === 1) {
                this.sunk = false;
            }
        }
    }
};

function createNewSession() {
    var session = nextId.toString();
    nextId++;
    return session;
}
