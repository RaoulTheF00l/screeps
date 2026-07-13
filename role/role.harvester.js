const roleHarvester = {
    run(creep) {
        updateWorkingState(creep);

        if (!creep.memory.working) {
            harvestEnergy(creep);
            return;
        }

        deliverEnergy(creep);
    }
};

function updateWorkingState(creep) {
    if (
        creep.memory.working &&
        creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0
    ) {
        creep.memory.working = false;
        creep.say("harvest");
    }

    if (
        !creep.memory.working &&
        creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0
    ) {
        creep.memory.working = true;
        creep.say("deliver");
    }
}

function harvestEnergy(creep) {
    const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

    if (!source) {
        return;
    }

    const result = creep.harvest(source);

    if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {
            visualizePathStyle: {
                stroke: "#ffffff"
            }
        });
    }
}

function deliverEnergy(creep) {
    const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: structure => {
            const acceptsEnergy =
                structure.structureType === STRUCTURE_SPAWN ||
                structure.structureType === STRUCTURE_EXTENSION ||
                structure.structureType === STRUCTURE_TOWER;

            return (
                acceptsEnergy &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
        }
    });

    if (target) {
        const result = creep.transfer(target, RESOURCE_ENERGY);

        if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {
                visualizePathStyle: {
                    stroke: "#ffffff"
                }
            });
        }

        return;
    }

    /*
     * Nothing currently needs energy.
     * Help upgrade the controller instead of standing still.
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

module.exports = roleHarvester;