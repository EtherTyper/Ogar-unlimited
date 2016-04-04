var GameMode = require('../../gamemodes');

module.exports = function (gameServer, split) {
  var delay = parseInt(split[1] * 1000);
  var dur = parseInt(split[2] * 1000);
  var re = parseInt(split[3]);
  var newLB = [];
  var n = [];
  if (isNaN(delay)) {
    console.log("[Console] Please specify a valid delay!");
    return;
  }
  if (isNaN(dur)) {
    console.log("[Console] Please specify a valid duration!");
    return;
  }
  if (isNaN(re)) {
    console.log("[Console] Please specify a valid times to repeat!");
    return;
  }
  for (var i = 4; i < split.length; i++) {
    newLB[i - 4] = split[i];
  }
  console.log("[PFMSG] Your request has been sent");
  console.log(delay + " " + dur + " " + re);
  var n = [];
  gameServer.pfmsg = 1;
  var r = 1;
  pfmsgt = setInterval(function () {
    gameServer.lleaderboard = false;
    gameServer.getWorld().getGameMode().packetLB = 48;
    gameServer.getWorld().getGameMode().specByLeaderboard = false;
    gameServer.getWorld().getGameMode().updateLB = function (gameServer) {
      gameServer.leaderboard = newLB
    };
    for (var i = 0; i < gameServer.clients.length; i++) {
      var client = gameServer.clients[i].playerTracker;
      n[i] = client.name;

      if (client.pID == i + 1) {
        client.name = "Look At Leaderboard";
      }

    }
    gameServer.overideauto = true;
    gameServer.run = false;
    console.log("[PFMSG] The message has been broadcast " + r + "/" + re);
    var gm = GameMode.get(gameServer.getWorld().getGameMode().ID);
    setTimeout(function () {
      // Replace functions
      gameServer.getWorld().getGameMode().packetLB = gm.packetLB;
      gameServer.getWorld().getGameMode().updateLB = gm.updateLB;
      for (var i = 0; i < gameServer.clients.length; i++) {
        var client = gameServer.clients[i].playerTracker;

        if (client.pID == i + 1) {
          client.name = n[i];
        }

      }
      gameServer.overideauto = false;
      gameServer.run = true;
      console.log("[PFMSG] The game has been reset");
      setTimeout(function () {
        gameServer.lleaderboard = true;
      }, 2000);
      r++;
      if (r > re) {
        console.log("[PFMSG] Done");
        clearInterval(pfmsgt);
      }

    }, dur);

  }, delay);

};
