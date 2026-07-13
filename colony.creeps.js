const roleHarvester = require("role.harvester");
const roleMiner = require("role.miner");
const roleHauler = require("role.hauler");
const roleUpgrader = require("role.upgrader");
const roleBuilder = require("role.builder");

const ROLE_MODULES = {
    harvester: roleHarvester,
    miner: roleMiner,
    hauler: roleHauler,
    upgrader: roleUpgrader,
    builder: roleBuilder
};

function cleanDeadMemory() {
    if (!Memory.creeps) {
        Memory.creeps = {};
        return;
    }

    for (const creepName in Memory.creeps) {
        if (Game.creeps[creepName]) {
            continue;
        }

        delete Memory.creeps[creepName];

        console.log(
            `Removed dead creep from memory: ${creepName}`
        );
    }
}

function run() {
    for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];

        runCreep(creep);
    }
}

function runCreep(creep) {
    const roleName = creep.memory.role;
    const roleModule = ROLE_MODULES[roleName];

    if (!roleModule) {
        console.log(
            `${creep.name} has unknown role: ${roleName}`
        );

        return;
    }

    try {
        roleModule.run(creep);
    } catch (error) {
        console.log(
            `[Creep Error] ${creep.name} (${roleName}): ` +
            `${error.stack || error}`
        );
    }
}

module.exports = {
    cleanDeadMemory,
    run
};