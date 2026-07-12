const {
    ROLE_TARGETS,
    SPAWN_PRIORITY
} = require("colony.config");

const BODY_OPTIONS = {
    worker: [
        {
            cost: 400,
            parts: [
                WORK,
                WORK,
                CARRY,
                CARRY,
                MOVE,
                MOVE
            ]
        },
        {
            cost: 300,
            parts: [
                WORK,
                CARRY,
                CARRY,
                MOVE,
                MOVE
            ]
        },
        {
            cost: 200,
            parts: [
                WORK,
                CARRY,
                MOVE
            ]
        }
    ],

    miner: [
        {
            cost: 600,
            parts: [
                WORK,
                WORK,
                WORK,
                WORK,
                WORK,
                CARRY,
                MOVE
            ]
        },
        {
            cost: 400,
            parts: [
                WORK,
                WORK,
                WORK,
                CARRY,
                MOVE
            ]
        }
    ],

    hauler: [
        {
            cost: 600,
            parts: [
                CARRY,
                CARRY,
                MOVE,
                CARRY,
                CARRY,
                MOVE,
                CARRY,
                CARRY,
                MOVE,
                CARRY,
                CARRY,
                MOVE
            ]
        },
        {
            cost: 450,
            parts: [
                CARRY,
                CARRY,
                MOVE,
                CARRY,
                CARRY,
                MOVE,
                CARRY,
                CARRY,
                MOVE
            ]
        },
        {
            cost: 300,
            parts: [
                CARRY,
                CARRY,
                MOVE,
                CARRY,
                CARRY,
                MOVE
            ]
        }
    ]
};

function run() {
    const spawn = Object.values(Game.spawns)[0];

    if (!spawn) {
        console.log("No spawn found.");
        return;
    }

    if (spawn.spawning) {
        drawSpawningStatus(spawn);
        return;
    }

    const counts = countCreepsByRole();
    const roleName = chooseNextRole(counts);

    if (!roleName) {
        return;
    }

    spawnRole(spawn, roleName);
}

function drawSpawningStatus(spawn) {
    const creepName = spawn.spawning.name;
    const creepMemory = Memory.creeps
        ? Memory.creeps[creepName]
        : null;

    const roleName = creepMemory
        ? creepMemory.role
        : "creep";

    spawn.room.visual.text(
        `⚙ ${roleName}`,
        spawn.pos.x + 1,
        spawn.pos.y,
        {
            align: "left",
            opacity: 0.8
        }
    );
}

function countCreepsByRole() {
    const counts = {};

    for (const roleName in ROLE_TARGETS) {
        counts[roleName] = 0;
    }

    for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];
        const roleName = creep.memory.role;

        if (counts[roleName] === undefined) {
            continue;
        }

        counts[roleName]++;
    }

    return counts;
}

function chooseNextRole(counts) {
    for (const roleName of SPAWN_PRIORITY) {
        const currentCount = counts[roleName];
        const targetCount = ROLE_TARGETS[roleName];

        if (currentCount < targetCount) {
            return roleName;
        }
    }

    return null;
}

function spawnRole(spawn, roleName) {
    const body = chooseBody(
        roleName,
        spawn.room.energyAvailable
    );

    if (!body) {
        return;
    }

    const memory = createCreepMemory(
        roleName,
        spawn.room
    );

    if (!memory) {
        return;
    }

    const creepName = `${roleName}-${Game.time}`;

    const result = spawn.spawnCreep(
        body,
        creepName,
        { memory }
    );

    if (result === OK) {
        console.log(`Spawning ${creepName}`);
        return;
    }

    if (result !== ERR_NOT_ENOUGH_ENERGY) {
        console.log(
            `Could not spawn ${creepName}: error ${result}`
        );
    }
}

function createCreepMemory(roleName, room) {
    const memory = {
        role: roleName
    };

    if (
        roleName === "harvester" ||
        roleName === "builder" ||
        roleName === "upgrader"
    ) {
        memory.working = false;
    }

    if (roleName === "hauler") {
        memory.delivering = false;
    }

    if (roleName === "miner") {
        const sourceId = chooseSourceForMiner(room);

        if (!sourceId) {
            console.log(
                "Could not find a source for the miner."
            );

            return null;
        }

        memory.sourceId = sourceId;
    }

    return memory;
}

function chooseBody(roleName, availableEnergy) {
    let bodyType = "worker";

    if (roleName === "miner") {
        bodyType = "miner";
    }

    if (roleName === "hauler") {
        bodyType = "hauler";
    }

    const options = BODY_OPTIONS[bodyType];

    for (const option of options) {
        if (availableEnergy >= option.cost) {
            return option.parts;
        }
    }

    return null;
}

function chooseSourceForMiner(room) {
    const sources = room.find(FIND_SOURCES);

    if (sources.length === 0) {
        return null;
    }

    let selectedSource = sources[0];
    let lowestMinerCount = Infinity;

    for (const source of sources) {
        const minerCount = countMinersAssignedTo(
            source.id
        );

        if (minerCount >= lowestMinerCount) {
            continue;
        }

        selectedSource = source;
        lowestMinerCount = minerCount;
    }

    return selectedSource.id;
}

function countMinersAssignedTo(sourceId) {
    let count = 0;

    for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];

        if (
            creep.memory.role === "miner" &&
            creep.memory.sourceId === sourceId
        ) {
            count++;
        }
    }

    return count;
}

module.exports = {
    run
};