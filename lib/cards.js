var util = require('util');
var f = util.format;

var defaultMessages = {
  protected: 'Whoops, %s is protected this round.'
};

module.exports = [
  {
    number: 1,
    name: 'Guard',
    description: 'Name a non-Guard card and choose another player. If that player has that card, they are out of the round.',
    summary: 'Guess a player\'s hand',
    count: 5,

    /**
     * @param options.opponent - player object that was chosen
     * @param options.guess - card name guess for opponent
     */
    play: function (oppName, cardGuess) {
      var opponent = this.game.getPlayer(oppName);

      this.game.message.send('%s has guessed that %s is holding a(n) %s', this.player.name, opponent.name, cardGuess);

      // Opponent is protected by 4 card this round
      if (opponent.lastPlay.number === 4) {
        this.game.message.send(defaultMessages.protected, opponent.name);
        return this.game.next();
      }

      // Can't guess the 1 card
      if (cardGuess.toLowerCase() === this.card.name.toLowerCase()) {
        this.game.message.send('Bzzt, can\'t guess Guard!');
        return this.game.next();
      }

      // Guessed correctly
      if (cardGuess.toLowerCase() === opponent.hand.name.toLowerCase()) {
        this.game.knockOut(opponent);
        this.game.message.send('Correct guess! %s has been eliminated.', opponent.name);
        return this.game.next();
      }

      // Guessed incorrectly
      this.game.message.send('Sorry, wrong guess.');
      this.game.next();
    }
  },
  {
    number: 2,
    name: 'Priest',
    description: '',
    summary: 'Look at a hand',
    count: 2,

    play: function (oppName) {
      var opponent = this.game.getPlayer(oppName);
      this.game.message.send('%s has asked to see %s\'s hand', this.player.name, opponent.name);

      // Opponent is protected by 4 card this round
      if (opponent.lastPlay.number === 4) {
        this.game.message.send(defaultMessages.protected, opponent.name);
        return this.game.next();
      }

      this.game.message.dm(this.player, '%s has a %s card', opponent.name, opponent.hand.name);
      this.game.next();
    }
  },
  {
    number: 3,
    name: 'Baron',
    description: '',
    summary: 'Compare hands; lower hand is out',
    count: 2,

    play: function (oppName) {
      var opponent = this.game.getPlayer(oppName);
      var winner, loser;

      this.game.message.send('%s is comparing hands with %s', this.player.name, opponent.name);

      // Opponent is protected by 4 card this round
      if (opponent.lastPlay.number === 4) {
        this.game.message.send(defaultMessages.protected, opponent.name);
        return this.game.next();
      }

      this.game.message.dm(this.player, '%s has a %s (%s)', opponent.name, opponent.hand.name, opponent.hand.number);
      this.game.message.dm(opponent, '%s has a %s (%s)', this.player.name, this.player.hand.name, this.player.hand.number);

      if (this.player.hand.number > opponent.hand.number) {
        winner = this.player, loser = opponent;
      } else if (opponent.hand.number > this.player.hand.number) {
        winner = opponent, loser = this.player;
      } else {
        // It was a tie.
        this.game.message.send('Neither is eliminated.');
        return this.game.next();
      }

      this.game.knockOut(loser);
      this.game.message.send('%s has beaten %s who has been eliminated along with their %s (%s)',winner.name, loser.name, loser.hand.name, loser.hand.number);
      this.game.next();
    }
  },
  {
    number: 4,
    name: 'Handmaid',
    description: '',
    summary: 'Protection until your next turn',
    count: 2,

    play: function () {
      this.game.message.send('%s has played the handmaid card and is protected for the next round', this.player.name);
      this.game.next();
    }
  }
];

