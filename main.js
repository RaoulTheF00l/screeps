const roleHarvester = require("role.harvester");
const roleUpgrader = require("role.upgrader");
const roleBuilder = require("role.builder");
const roleMiner = require("role.miner");
const roleHauler = require("role.hauler");

const roomVisuals = require("room.visuals");
const TowerManager = require("room.towers");
// const RoadPlanner = require("room.roads");


const ROLE_TARGETS = {
    harvester: 6,
    upgrader: 1,
    builder: 1
};


module.exports.loop = function () {
    cleanDeadCreepMemory();
    manageCreepPopulation();

    runCreeps();
    runTowers();
    drawRoomVisuals();
};


/*
 * Removes memory entries belonging to creeps
 * that have died.
 */
function cleanDeadCreepMemory() {
    for (const creepName in Memory.creeps) {
        if (!Game.creeps[creepName]) {
            delete Memory.creeps[creepName];

            console.log(
                `Removed dead creep from memory: ${creepName}`
            );
        }
    }
}


/*
 * Checks which role the colony needs and
 * spawns the appropriate creep.
 */
function manageCreepPopulation() {
    const spawn = Object.values(Game.spawns)[0];

    if (!spawn) {
        console.log("No spawn found.");
        return;
    }

    /*
     * If the spawn is already creating a creep,
     * show the role above the spawn and stop here.
     */
    if (spawn.spawning) {
        const spawningCreep =
            Game.creeps[spawn.spawning.name];

        if (spawningCreep) {
            spawn.room.visual.text(
                `🛠️ ${spawningCreep.memory.role}`,
                spawn.pos.x + 1,
                spawn.pos.y,
                {
                    align: "left",
                    opacity: 0.8
                }
            );
        }

        return;
    }

    const roleToSpawn = chooseNextRole();

    if (!roleToSpawn) {
        return;
    }

    const body = chooseBody(
        roleToSpawn,
        spawn.room.energyAvailable
    );

    /*
     * A null body means the room does not currently
     * have enough energy for this role.
     */
    if (!body) {
        return;
    }

    const creepMemory = {
        role: roleToSpawn,
        working: false
    };

    /*
     * Miners receive a permanent source assignment
     * when they are created.
     */
    if (roleToSpawn === "miner") {
        const sourceId = chooseSourceForMiner(
            spawn.room
        );

        if (!sourceId) {
            console.log(
                "Could not find a source for the miner."
            );

            return;
        }

        creepMemory.sourceId = sourceId;
    }

    const creepName =
        `${roleToSpawn}-${Game.time}`;

    const result = spawn.spawnCreep(
        body,
        creepName,
        {
            memory: creepMemory
        }
    );

    if (result === OK) {
        console.log(
            `Spawning ${creepName}`
        );
    } else if (
        result !== ERR_NOT_ENOUGH_ENERGY
    ) {
        console.log(
            `Could not spawn ${creepName}: error ${result}`
        );
    }

    
}


/*
 * Decides which type of creep should be
 * spawned next.
 */
function chooseNextRole() {
    const counts = countCreepsByRole();

    /*
     * Harvesters come first because they allow
     * the colony to recover if energy production fails.
     */
    if (
        counts.harvester <
        ROLE_TARGETS.harvester
    ) {
        return "harvester";
    }

    if (
        counts.miner <
        ROLE_TARGETS.miner
    ) {
        return "miner";
    }

    if (
        counts.hauler <
        ROLE_TARGETS.hauler
    ) {
        return "hauler";
    }

    if (
        counts.upgrader <
        ROLE_TARGETS.upgrader
    ) {
        return "upgrader";
    }

    if (
        counts.builder <
        ROLE_TARGETS.builder
    ) {
        return "builder";
    }

    return null;
}


/*
 * Counts all currently living creeps by role.
 */
function countCreepsByRole() {
    const counts = {
    harvester: 0,
    miner: 0,
    hauler: 0,
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


/*
 * Assigns a miner to whichever source currently
 * has the fewest living miners assigned to it.
 */
function chooseSourceForMiner(room) {
    const sources = room.find(FIND_SOURCES);

    if (sources.length === 0) {
        return null;
    }

    let selectedSource = sources[0];
    let lowestMinerCount = Infinity;

    for (const source of sources) {
        let assignedMinerCount = 0;

        for (const creepName in Game.creeps) {
            const creep = Game.creeps[creepName];

            if (
                creep.memory.role === "miner" &&
                creep.memory.sourceId === source.id
            ) {
                assignedMinerCount++;
            }
        }

        if (
            assignedMinerCount <
            lowestMinerCount
        ) {
            selectedSource = source;
            lowestMinerCount =
                assignedMinerCount;
        }
    }

    return selectedSource.id;
}


/*
 * Creates a body appropriate for the selected role
 * using the room's currently available energy.
 */
function chooseBody(
    role,
    availableEnergy
) {
    /*
     * Miner bodies prioritize WORK.
     */
    if (role === "miner") {
        if (availableEnergy >= 600) {
            return [
                WORK,
                WORK,
                WORK,
                WORK,
                WORK,
                CARRY,
                MOVE
            ];
        }

        if (availableEnergy >= 400) {
            return [
                WORK,
                WORK,
                WORK,
                CARRY,
                MOVE
            ];
        }

        return null;
    }

    /*
     * Hauler bodies only need CARRY and MOVE.
     */
    if (role === "hauler") {
        /*
         * 600 energy
         * Carries 400 energy.
         */
        if (availableEnergy >= 600) {
            return [
                CARRY, CARRY, MOVE,
                CARRY, CARRY, MOVE,
                CARRY, CARRY, MOVE,
                CARRY, CARRY, MOVE
            ];
        }

        /*
         * 450 energy
         * Carries 300 energy.
         */
        if (availableEnergy >= 450) {
            return [
                CARRY, CARRY, MOVE,
                CARRY, CARRY, MOVE,
                CARRY, CARRY, MOVE
            ];
        }

        /*
         * 300 energy
         * Carries 200 energy.
         */
        if (availableEnergy >= 300) {
            return [
                CARRY, CARRY, MOVE,
                CARRY, CARRY, MOVE
            ];
        }

        return null;
    }

    /*
     * General-purpose bodies for harvesters,
     * builders, and upgraders.
     */
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

    if (availableEnergy >= 200) {
        return [
            WORK,
            CARRY,
            MOVE
        ];
    }

    return null;
}


/*
 * Runs each creep's role module.
 */
function runCreeps() {
    for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];

        try {
            switch (creep.memory.role) {
                case "harvester":
                    roleHarvester.run(creep);
                    break;

                case "miner":
                    roleMiner.run(creep);
                    break;

                case "hauler":
                    roleHauler.run(creep);
                    break;

                case "upgrader":
                    roleUpgrader.run(creep);
                    break;

                case "builder":
                    roleBuilder.run(creep);
                    break;

                default:
                    console.log(
                        `${creep.name} has unknown role: ` +
                        `${creep.memory.role}`
                    );

                    break;
            }
        } catch (error) {
            console.log(
                `[Creep Error] ${creep.name} ` +
                `(${creep.memory.role}): ` +
                `${error.stack || error}`
            );
        }
    }
}


/*
 * Runs the road planner in every owned room.

function runRoadPlanners() {
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        if (
            room.controller &&
            room.controller.my
        ) {
            RoadPlanner.run(room);
        }
    }
}
*/


/*
 * Runs tower behavior in every owned room.
 */
function runTowers() {
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        if (
            room.controller &&
            room.controller.my
        ) {
            TowerManager.run(room);
        }
    }
}


/*
 * Draws room statistics and other visual information.
 */
function drawRoomVisuals() {
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        if (
            room.controller &&
            room.controller.my
        ) {
            roomVisuals.run(room);
        }
    }
}