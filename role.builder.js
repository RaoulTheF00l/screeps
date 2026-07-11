const roleBuilder = {
    run(creep) {
        updateWorkingState(creep);

        if (!creep.memory.working) {
            collectEnergy(creep);
            return;
        }

        buildOrUpgrade(creep);
    }
};

function updateWorkingState(creep) {
    if (
        creep.memory.working &&
        creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0
    ) {
        creep.memory.working = false;
        creep.say("energy");
    }

    if (
        !creep.memory.working &&
        creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0
    ) {
        creep.memory.working = true;
        creep.say("build");
    }
}

function collectEnergy(creep) {
    const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

    if (!source) {
        return;
    }

    const result = creep.harvest(source);

    if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {
            visualizePathStyle: {
                stroke: "#00ff88"
            }
        });
    }
}

function buildOrUpgrade(creep) {
    const constructionSite =
        creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);

    if (constructionSite) {
        const result = creep.build(constructionSite);

        if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(constructionSite, {
                visualizePathStyle: {
                    stroke: "#00ff88"
                }
            });
        }

        return;
    }

    /*
     * No construction sites exist.
     * Builders temporarily become upgraders.
     */
    const controller = creep.room.controller;

    if (!controller) {
        return;
    }

    const result = creep.upgradeController(controller);

    if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(controller);
    }
}

module.exports = roleBuilder;