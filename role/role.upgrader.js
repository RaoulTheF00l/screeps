const roleUpgrader = {
    run(creep) {
        updateWorkingState(creep);

        if (!creep.memory.working) {
            collectEnergy(creep);
            return;
        }

        upgradeController(creep);
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
        creep.say("upgrade");
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
                stroke: "#ffaa00"
            }
        });
    }
}

function upgradeController(creep) {
    const controller = creep.room.controller;

    if (!controller) {
        return;
    }

    const result = creep.upgradeController(controller);

    if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(controller, {
            visualizePathStyle: {
                stroke: "#ffaa00"
            }
        });
    }
}

module.exports = roleUpgrader;