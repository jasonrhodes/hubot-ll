var _ = require('lodash');
var db = require('./lib/db');
var util = require('util');
var deck = require('./lib/cards');
var robot, res;;
var game = module.exports;

game = {

  /**
   * DI access to the robot object
   *
   */
  init: function (r) {
    robot = r;
  },

  /**
   * Hack to give access to the current res object for messaging
   * 
   */
  set: function (r) {
    res = r;
  },

  db: db,

  /**
   * Various messaging paths, from the stored res object
   *
   */
  message: {
    
    /**
     * Sends to the room where the trigger was 'heard'
     *
     */
    send: function () {
      res.send(util.format.apply(null, arguments));
    },

    /**
     * Replies to the user who made the call
     *
     */
    reply: function () {
      res.reply(util.format.apply(null, arguments));
    },

    /**
     * Direct messages the specified user
     *
     */
    dm: function (player) {
      robot.messageRoom(player.name, util.format.apply(null, arguments.slice(1)));
    }

  },

  join: function (name) {
    db.players = db.players || {};
    db.players[name] = { name: name };

    game.message.send('%s has joined the love letter game, making %s players for next round', name, db.players.length);
  },

  quit: function (player) {
    delete db.alive[player.name];
    delete db.players[player.name];

    game.message.send('%s has dropped out of the game, there are now %s players for next round', player.name, db.players.length
  },

  start: function () {
    db.leadPlayer = db.leadPlayer ? game.getPlayer(db.leadPlayer) : _.first(db.alive);
    db.currentPlayer = db.leadPlayer.name;
    game.next();
  },

  knockOut: function (player) {
    delete db.alive[player.name];
  },

  finish: function () {
    db.gameInProgress = false;
    // Check remaining alive players for highest point card, declare winner
    
    var winval = Math.max(_.pluck(db.alive, 'hand').map(function (card) {
      return card.number;
    }));
    var winners = db.alive.filter(function (player) {
      return player.hand.number === winval;
    });

    if (winners.length > 1) {
      winval = Math.max(winners.map(game.getDiscardValue));

    }

    return false;
  },

  abandon: function () {
    db.alive = {};
    db.gameInProgress = false;
  },

  advanceNextPlayer: function () {
    var players = Object.keys(db.players);
    var i = players.indexOf(db.currentPlayer);
    if (i + 1 >= players.length) {
      i = 0;
    }
    db.currentPlayer = players[i];

    if (!db.alive[db.currentPlayer]) {
      game.advanceNextPlayer();
    }
  },

  next: function () {
    var player = game.getPlayer(db.currentPlayer);
    if (game.draw(next)) {
      game.message.send('It\'s %s\'s turn.', next.name);
    }
    game.advanceNextPlayer();
  },

  shuffle: function () {
    var shuffled = [];
    deck.forEach(function (card) {
      for (var i = 0; i < card.count; i++) {
        shuffled.push(_.cloneDeep(card));
      }
    });
    return _.shuffle(shuffled);
  },

  deal: function () {
    if (db.gameInProgress) {
      return game.message.reply('Please don\'t try to deal mid-game.');
    }
    db.gameInProgress = true;
    db.deck = shuffle(allCards);
    db.alive = _.cloneDeep(db.players);
    db.alive.forEach(function (player) {
      player.hand = db.deck.shift();
      game.message.dm(player, 'You were dealt: %s \n\n%s', player.hand.name, player.hand.description);
    });
    db.burn = db.deck.shift();
    game.start();
  },

  draw: function (player) {
    var next = db.deck.shift();
    if (!next) {
      return game.finish();
    }
    player.drawn = next;
    game.message.dm(player, 'You drew: %s', next.name);
    return next;
  },

  discard: function (player) {
    game.message.send('%s has discarded their %s', player.name, player.hand.name);

    if (player.hand.number === 8) {
      game.message.send('%s has been eliminated', player.name);
      game.knockOut(player);
      return game.next();
    }

    var next = db.deck.shift();
    if (!next) {
      return game.finish();
    }

    game.trackDiscards(player, player.hand);
    player.hand = next;
    game.message.dm(player, 'You drew: %s', next.name);
  },

  trackDiscards: function (player, card) {
    player.discards = player.discards || [];
    player.discards.push(card);
  },

  getDiscardValue: function (player) {
    return _.pluck(player.discards, 'number').reduce(function (a, b) {
      return a + b;
    }, 0);
  },

  settleHand: function (player, played) {
    if (player.drawn.name.toLowerCase() === played.toLowerCase()) {
      player.lastPlay = player.drawn;
      delete player.drawn;
      return player.lastPlay;
    }

    if (player.hand.name.toLowerCase() === played.toLowerCase()) {
      player.lastPlay = _.cloneDeep(player.hand);
      player.hand = player.drawn;
      delete player.drawn;
      return player.lastPlay;
    }
      
    game.print('%s, you don\'t have a %s card — check your hand?', player.name, played);
    return false;
  },

  play: function (player, cardName, options) {
    if (var card = game.settleHand(player, cardName)) {
      game.message.send('%s played a(n) %s', player.name, cardName);
      card.play.apply({ player: player, card: card, game: game }, options.split(':'));
      game.trackDiscards(player, card);
    }
  },

  getPlayer: function (name) {
    var player = db.alive[name];
    if (!player) {
      game.message.send('%s is not a current player in this game', name);
      return false;
    }
    return player;
  }

};