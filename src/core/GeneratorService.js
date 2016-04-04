'use strict';
var utilities = require('./utilities.js');
var Entity = require('../entity');
const DataBaseConnector = require('./DataBaseConnector.js');

module.exports = class GeneratorService {
  constructor(gameServer, world, config) {
    this.gameServer = gameServer;
    this.interval = undefined;
    this.dataBase = new DataBaseConnector('world');
    this.world = world; // todo this is temp
    this.config = config;
  }

  init() {
    this.world.initNodeType('player');
    this.world.initNodeType('moving');
    this.world.initNodeType('ejected');
    this.world.initNodeType('virus');
    this.world.initNodeType('food');


    for (var i = 0; i < this.config.foodStartAmount; i++) {
      this.spawnFood();
    }
  }

  start() {
    this.interval = setInterval(this.update.bind(this), this.config.spawnInterval);
  }

  stop() {
    clearInterval(this.interval);
  }

  update() {
    let toSpawn = Math.min(this.config.foodSpawnAmount, (this.config.foodMaxAmount - this.world.getNodes('food').length));
    for (let i = 0; i < toSpawn; i++) {
      this.spawnFood();
    }
    this.virusCheck();
  }

  spawnFood() {
    let f = new Entity.Food(this.world.getNextNodeId(), null, this.world.getRandomPosition(this.config.borderRight, this.config.borderLeft, this.config.borderBottom, this.config.borderTop), this.config.foodMass, this.world);
    f.setColor(utilities.getRandomColor());

    this.dataBase.put(f.toJSON());

    this.world.setNode(f.getId(), f, 'food');
  };

  virusCheck() {
    // Checks if there are enough viruses on the map
    if (this.gameServer.spawnv == 1) {
      let virusNodes = this.world.getNodes('virus');
      if (virusNodes.length < this.config.virusMinAmount) {
        // Spawns a virus
        let pos = this.world.getRandomPosition(this.config.borderRight, this.config.borderLeft, this.config.borderBottom, this.config.borderTop);
        let virusSquareSize = (this.config.virusStartMass * 100) >> 0;

        // Check for players
        let result = this.world.getPlayerNodes().some((check)=> {
          if (check.mass < this.config.virusStartMass) return false;

          var squareR = check.getSquareSize(); // squared Radius of checking player cell

          var dx = check.position.x - pos.x;
          var dy = check.position.y - pos.y;

          if (dx * dx + dy * dy + virusSquareSize <= squareR)
            return true; // Collided
        });
        if (result) return;

        // Spawn if no cells are colliding
        let v = new Entity.Virus(this.world.getNextNodeId(), null, pos, this.config.virusStartMass, this);
        this.world.setNode(v.getId(), v, 'virus');
      }
    }
  };

  getRandomSpawn() {
    // Random spawns for players
    let pos = undefined;

    if (this.world.getNodes('food').length > 0) {
      // Spawn from food
      let nodes = this.world.getNodes('food');
      nodes.some((node)=> {
        if (!node || node.inRange) {
          // Skip if food is about to be eaten/undefined
          return false;
        }

        if (node.getType() == 1) {
          pos = {
            x: node.position.x,
            y: node.position.y
          };
          this.removeNode(node);
          return true;
        }
      });
    }

    // Return random spawn if no food cell is found
    return (pos) ? pos : this.world.getRandomPosition();
  }

  getCurrentFood() {
    return this.world.getNodes('food').length;
  }

  removeNode(node) {
    this.world.removeNode(node.getId());
    // Special on-remove actions
    node.onRemove(this);

    // todo this is a big problem for splitting up the processes
    // Animation when eating
    let clients = this.world.getClients();
    for (let i = 0; i < clients.length; i++) {
      let client = clients[i].playerTracker;
      if (!client) {
        continue;
      }

      // Remove from client
      client.nodeDestroyQueue.push(node);
    }
  }
};
