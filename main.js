const creepManager = require("colony.creeps");
const populationManager = require("colony.population");
const roomManager = require("colony.rooms");

module.exports.loop = function () {
    creepManager.cleanDeadMemory();
    populationManager.run();
    creepManager.run();
    roomManager.run();
};