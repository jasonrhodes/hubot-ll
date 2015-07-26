var game = require('./lib/game');

module.exports = function (robot) {

  game.init(robot);

  robot.hear(/^ll join/i, function (res) {
    game.join(res.message.user.name);
  });

  robot.hear(/^ll play ([a-z]+) ?(\w)?/i, function (res) {
    game.set(res);
    game.play(res.message.user.name, res.match[0], res.match[1]);
  });

  beacon.on('message', function (message) {

  });

  beacon.on('reply', function (player, message) {

  });

};

