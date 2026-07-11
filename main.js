const roleHarvester = require("role.harvester");
const roleUpgrader = require("role.upgrader");
const roleBuilder = require("role.builder");
const roomVisuals = require("room.visuals");
const TowerManager = require("room.towers");
const RoadPlanner = require("room.roads");


const ROLE_TARGETS = {
    harvester: 4,
    upgrader: 1,
    builder: 1
};

module.exports.loop = function () {
    cleanDeadCreepMemory();
    manageCreepPopulation();
    
    runRoadPlanners();
    runCreeps();
    runTowers();
    drawRoomVisuals();
};

function cleanDeadCreepMemory() {
    for (const creepName in Memory.creeps) {
        if (!Game.creeps[creepName]) {
            delete Memory.creeps[creepName];
            console.log(`Removed dead creep from memory: ${creepName}`);
        }
    }
}

function manageCreepPopulation() {
    const spawn = Object.values(Game.spawns)[0];

    if (!spawn) {
        console.log("No spawn found.");
        return;
    }

    if (spawn.spawning) {
        const spawningCreep = Game.creeps[spawn.spawning.name];

        if (spawningCreep) {
            spawn.room.visual.text(
                `🛠️ ${spawningCreep.memory.role}`,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: "left", opacity: 0.8 }
            );
        }

        return;
    }

    const roleToSpawn = chooseNextRole();

    if (!roleToSpawn) {
        return;
    }

    const body = chooseBody(spawn.room.energyAvailable);

    if (!body) {
        return;
    }

    const creepName = `${roleToSpawn}-${Game.time}`;

    const result = spawn.spawnCreep(body, creepName, {
        memory: {
            role: roleToSpawn,
            working: false
        }
    });

    if (result === OK) {
        console.log(`Spawning ${creepName}`);
    } else if (result !== ERR_NOT_ENOUGH_ENERGY) {
        console.log(`Could not spawn ${creepName}: error ${result}`);
    }
}

function chooseNextRole() {
    const counts = countCreepsByRole();

    /*
     * Harvesters always have priority.
     * Without harvesters, the room cannot recover.
     */
    if (counts.harvester < ROLE_TARGETS.harvester) {
        return "harvester";
    }

    if (counts.upgrader < ROLE_TARGETS.upgrader) {
        return "upgrader";
    }

    if (counts.builder < ROLE_TARGETS.builder) {
        return "builder";
    }

    return null;
}

function countCreepsByRole() {
    const counts = {
        harvester: 0,
        upgrader: 0,
        builder: 0
    };

    for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];
        const role = creep.memory.role;

        if (counts[role] !== undefined) {
            counts[role]++;
        }
    }

    return counts;
}

function chooseBody(availableEnergy) {
    /*
     * Start cheaply so the colony can recover after a disaster.
     *
     * 200 energy:
     * WORK = 100
     * CARRY = 50
     * MOVE = 50
     */
    if (availableEnergy < 200) {
        return null;
    }

    if (availableEnergy >= 400) {
        return [
            WORK,
            WORK,
            CARRY,
            CARRY,
            MOVE,
            MOVE
        ];
    }

    if (availableEnergy >= 300) {
        return [
            WORK,
            CARRY,
            CARRY,
            MOVE,
            MOVE
        ];
    }

    return [
        WORK,
        CARRY,
        MOVE
    ];
}

function runCreeps() {
    for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];

        switch (creep.memory.role) {
            case "harvester":
                roleHarvester.run(creep);
                break;

            case "upgrader":
                roleUpgrader.run(creep);
                break;

            case "builder":
                roleBuilder.run(creep);
                break;

            default:
                console.log(
                    `${creep.name} has unknown role: ${creep.memory.role}`
                );
                break;
        }
    }
}

function runRoadPlanners() {
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        if (room.controller && room.controller.my) {
            RoadPlanner.run(room);
        }
    }
}

function runTowers() {
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        if (room.controller && room.controller.my) {
            TowerManager.run(room);
        }
    }
}

function drawRoomVisuals() {
    for(const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        if(room.controller && room.controller.my) {
            roomVisuals.run(room);
        }
    }
}

