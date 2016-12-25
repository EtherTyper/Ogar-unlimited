'use strict';
/*
Proverbs 20:18:
   Bread obtained by falsehood is sweet to a man, But afterward his mouth will be filled with gravel.
We worked really hard for this project. Although we dont care if you enhance it and publish, we would care
if you copy it and claim our work as your own. Although it might feel good, to take the credit, you would ultimatly
regret it. But please feel free to change the files and publish putting your name up as well as ours.
We will also not get into legalities. but please dont take advantage that we dont use
legalities. Instead, treat us with respect like we treat you. 
Sincerely
The AJS Dev Team.
*/
const fs = require("fs");
const child = require('child_process');

module.exports = class ChildService {
  constructor(gameServer) {
    this.gameServer = gameServer;
this.child = child.fork('core/child.js');
this.count = 1;
this.onmsg();
this.lastid = 0;
this.idData = [];
};
killall() {
  this.child.kill();
  //this.calcViewBox.kill();
  
}
feedNearestVirus(gameServer,cell) {
  var id = this.getnextid();
  this.idData[id] = cell;
  
  var tosend = {
    processID: id,
    action: "getnearestv",
    cell: {
      id: cell.getId(),
    position: cell.position,
    quadrant: cell.quadrant,
    },
    nodes: [],
  }
  gameServer.getWorld().getNodes('virus').forEach((node)=>{
   var a = {
    id: node.getId(),
    position: node.position,
    quadrant: node.quadrant,
   }
   tosend.nodes.push(a);
  });
  
  this.child.send(tosend);
}
getnextid() {
return this.lastid ++;
}
heartbeat() {
  this.child.send("j")
}
onmsg() {
this.child.on('message' ,(m)=>{
  if (m.action == "getnearestv") {
    if (m.data) {
      var vnode = this.gameServer.getWorld().getNodes('virus').get(m.data)
      if (vnode) vnode.feed(this.idData[m.processID], this.gameServer);
    }
    this.idData.slice(m.processID,1);
    
  } else 
  if (m.action == "updatenodes") {
    var player = this.idData[m.processID];
    player.socket.sendPacket(m.buf,true);
    this.idData.slice(m.processID,1);
    return;
  } else
if (m.action == "getcellsinrange") {
  var cell = this.idData[m.processID];
  var client = cell.owner;
    m.list.forEach((che)=> {

        var check = this.gameServer.getWorld().getNodes().get(che);
if (!check) return;
        if (check.cellType === 0 && (client != check.owner) && (cell.mass < check.mass * this.config.sizeMult) && this.config.playerRecombineTime !== 0) { //extra check to make sure popsplit works by retslac
          check.inRange = false;
          return;
        }

        // Consume effect
        check.onConsume(cell, this.gameServer);

        // Remove cell
        check.setKiller(cell);
        this.gameServer.removeNode(check);
        
      });
this.idData.slice(m.processID,1);
    }
  });
}
calcViewBox(player) {


};
updateNodes(destroyQueue, nodess, nonVisibleNodes, scrambleX, scrambleY, gameServer,player) {
var id = this.getnextid();
this.idData[id] = player;

  var result = {
    processID: id,
    action: "updatenodes",
    destroyQueue: [],
    nodes: [],
    nonVisibleNodes: [],
    scrambleX: scrambleX,
    scrambleY: scrambleY,
    gameServer: {
     config: gameServer.config,
      
    },
  };
  nonVisibleNodes.forEach((node)=>{
    if (!node) return;
    var a = {
    id: node.getId(),
    nodeId: node.getId(),
    position: node.position,
    mass: node.mass,
    size: node.getSize(),
    type: node.cellType,
    color: node.color,
    name: node.getName(),
    premium: node.getPremium(),
    spiked: node.spiked,
    }
    result.nonVisibleNodes.push(a);
  });
 nodess.forEach((node)=>{
    if (!node) return;
    var a = {
    id: node.getId(),
    position: node.position,
    nodeId: node.getId(),
    mass: node.mass,
    size: node.getSize(),
    type: node.cellType,
    color: node.color,
    name: node.getName(),
    premium: node.getPremium(),
    spiked: node.spiked,
    }
    result.nodes.push(a);
  });
  destroyQueue.forEach((node)=>{
    if (!node) return;
    var a = {
    id: node.getId(),
    position: node.position,
    mass: node.mass,
    type: node.cellType,
    killer: (node.getKiller()) ? node.getKiller().nodeId : false,
    nodeId: node.getId(),
    color: node.color,
    size: node.getSize(),
    name: node.getName(),
    premium: node.getPremium(),
    spiked: node.spiked,
    }
    result.destroyQueue.push(a);
  });
  this.child.send(result);
}
getCellsInRange(cell,gameServer) {
var id = this.getnextid();
this.idData[id] = cell;
  var result = {
    cells: [],
    processID: id,
    action: "getcellsinrange",
    config: gameServer.config,
    mass: cell.mass,
    id: cell.getId(),
    haveTeams: gameServer.gameMode.haveTeams,
    position: cell.position,
    mass: cell.mass,
    SquareSize: cell.getSquareSize(),
    type: cell.cellType,
    EatingRange: cell.getEatingRange(),
    owner: {
      id: cell.owner.pID,
      recombineinstant: cell.owner.recombineinstant,
      team: cell.owner.team,
    },
    SquareSize: cell.getSquareSize(),
  };
  cell.owner.visibleNodes.forEach((check)=> {
if (!check) return;
    var a = {
    mass: check.mass,
    id: check.getId(),
    position: check.position,
    mass: check.mass,
    owner: [],
    SquareSize: check.getSquareSize(),
    type: check.cellType,
    EatingRange: check.getEatingRange(),
    };
    if (check.owner) {
      a.owner = {
      id: check.owner.pID,
      recombineinstant: check.owner.recombineinstant,
      team: check.owner.team,
      };
    }
    result.cells.push(a);
  });
  
this.child.send(result);
  
  
}

  constructor() {
    this.getCellsInRange = child.fork('core/getCellsInRange.js');
    this.calcViewBox = child.fork('core/calcViewBox.js');
  }
  killall() {
    this.getCellsInRange.kill();
    this.calcViewBox.kill();
  }
}
