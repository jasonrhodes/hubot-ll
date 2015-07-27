var game = require('./lib/game');

module.exports = function (robot) {

  game.inject(robot);

  robot.hear(/^ll join/i, function (res) {
    game.set(res);
    game.join(res.message.user.name);
  });

  robot.hear(/^ll deal/i, function (res) {
    game.set(res);
    game.deal();
  });

  robot.hear(/^ll play ([a-z]+) ?([\w:]+)?/i, function (res) {
    game.set(res);
    game.play(game.getPlayer(res.message.user.name), res.match[1], res.match[2]);
  });

  robot.hear(/^ll hand/i, function (res) {
    game.set(res);
    game.showHand(game.getPlayer(res.message.user.name));
  });

};

