const roomVisuals = {
    run(room) {
        drawColonyStatus(room);
        drawConstructionProgress(room);
    }
};

function drawColonyStatus(room) {
    const counts = countCreepsByRole(room);

    const energyText =
        `Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`;

    const creepText =
        `Creeps: ` +
        `H${counts.harvester} ` +
        `M${counts.miner} ` +
        `Ha${counts.hauler} ` +
        `U${counts.upgrader} ` +
        `B${counts.builder}`;

    room.visual.text(
        energyText,
        1,
        1,
        {
            align: "left",
            font: 0.8,
            backgroundColor: "#000000",
            backgroundPadding: 0.2
        }
    );

    room.visual.text(
        creepText,
        1,
        2,
        {
            align: "left",
            font: 0.8,
            backgroundColor: "#000000",
            backgroundPadding: 0.2
        }
    );

    if (room.controller) {
        const controller = room.controller;

        const controllerText =
            `RCL ${controller.level}: ` +
            `${controller.progress}/${controller.progressTotal}`;

        room.visual.text(
            controllerText,
            1,
            3,
            {
                align: "left",
                font: 0.8,
                backgroundColor: "#000000",
                backgroundPadding: 0.2
            }
        );
    }
}

function countCreepsByRole(room) {
    const counts = {
        harvester: 0,
        miner: 0,
        hauler: 0,
        upgrader: 0,
        builder: 0
    };

    const creeps = room.find(FIND_MY_CREEPS);

    for (const creep of creeps) {
        const role = creep.memory.role;

        if (counts[role] !== undefined) {
            counts[role]++;
        }
    }

    return counts;
}

function drawConstructionProgress(room) {
    const constructionSites =
        room.find(FIND_MY_CONSTRUCTION_SITES);

    for (const site of constructionSites) {
        const percentage = Math.floor(
            site.progress /
            site.progressTotal *
            100
        );

        room.visual.text(
            `${percentage}%`,
            site.pos.x,
            site.pos.y - 0.6,
            {
                font: 0.5,
                backgroundColor: "#000000",
                backgroundPadding: 0.1
            }
        );
    }
}

module.exports = roomVisuals;