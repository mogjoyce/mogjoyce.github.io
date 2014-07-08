/****************************************************************************
'FAV2048' by Joyce Lee
*****************************************************************************

Based off '2048' with credits to:
The MIT License (MIT)
Copyright (c) 2014 Gabriele Cirulli

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

****************************************************************************/

window.requestAnimationFrame(function () {
  var key = document.getElementById("colorkey").getContext("2d");
  for (var i = 1; i <= 11; i++) {
    key.fillStyle = colorMe(Math.pow(2,i));
    key.fillRect((i-1)*100,0,100,100);
  }
  new GameManager(KeyboardInputManager);
});

function colorMe(value) {
  switch(value) {
    case 2:
    return "D6AD33"; //beige
    case 4:
    return "663300"; //brown
    case 8:
    return "9900FF"; //purple
    case 16:
    return "3333FF"; //dark blue
    case 32:
    return "00FFFF"; //cyan
    case 64:
    return "009933"; //dark green
    case 128:
    return "00FF00"; //bright green
    case 256:
    return "FFFF00"; //yellow
    case 512:
    return "FF6600"; //orange
    case 1024:
    return "FF00FF"; //pink
    case 2048:
    return "FF0000"; //red
    default:
    return "FFFFFF"; //white
  }
}

GameManager.prototype.fillGrid = function (grid, metadata) {
  var self = this;
  var c = document.getElementById("canvas");
  var ctx = c.getContext("2d");

  window.requestAnimationFrame(function () {
    ctx.fillStyle = colorMe();
    ctx.fillRect(0,0,16,16);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
		  ctx.fillStyle = colorMe(cell.value);
		  ctx.fillRect(4*cell.x,4*cell.y,4,4);
        }
      });
    });

    self.updateScore(metadata.score);

    var	icon = document.getElementById("favicon");
    (newIcon = icon.cloneNode(true)).setAttribute("href",ctx.canvas.toDataURL());
    icon.parentNode.replaceChild(newIcon,icon);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false);
      } else if (metadata.won) {
        self.message(true);
      }
    }

  });
};

GameManager.prototype.addTile = function (tile) {
  var self = this;

  if (tile.mergedFrom) {
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  }
};

GameManager.prototype.updateScore = function (score) {
  document.title = score;
};

GameManager.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  document.title = won ? "You won!" : "Press 'r'";
};

function KeyboardInputManager() {
  this.events = {};
  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
  };

  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
    }

    if (!modifiers && event.which === 82) {
      event.preventDefault();
      this.emit("restart");
    }
  });
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

function Tile(position, value) {
  this.x                = position.x;
  this.y                = position.y;
  this.value            = value || 2;

  this.previousPosition = null;
  this.mergedFrom       = null;
}

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
};

function Grid(size) {
  this.size = size;
  this.cells = this.empty();
}

Grid.prototype.empty = function () {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push({ x: x, y: y });
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size &&
         position.y >= 0 && position.y < this.size;
};

function GameManager(InputManager) {
  this.size = 4;
  this.startTiles = 2;
  this.score = 0;
  this.inputManager = new InputManager;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.setup();
}

GameManager.prototype.restart = function () {
  this.actuator.continueGame();
  this.setup();
};

GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame();
};

GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.keepPlaying);
};

GameManager.prototype.setup = function () {
  this.grid        = new Grid(this.size);
  this.score       = 0;
  this.over        = false;
  this.won         = false;
  this.keepPlaying = false;

  this.addStartTiles();
  this.actuate();
};

GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

GameManager.prototype.actuate = function () {

  this.fillGrid(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    terminated: this.isGameTerminated()
  });

};

GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

GameManager.prototype.move = function (direction) {
  var self = this;

  if (this.isGameTerminated()) return;

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  this.prepareTiles();

  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          tile.updatePosition(positions.next);

          self.score += merged.value;

          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true;
        }
      }
    });
  });

  if (moved) {
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true;
    }

    this.actuate();
  }
};

GameManager.prototype.getVector = function (direction) {
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
