const roleHauler = {
    run(creep) {
        updateDeliveryState(creep);

        if (creep.memory.delivering) {
            deliverEnergy(creep);
            return;
        }

        collectEnergy(creep);
    }
};


/*
 * Switches the hauler between:
 *
 * collecting = empty or partially empty
 * delivering = completely full
 */
function updateDeliveryState(creep) {
    const carriedEnergy =
        creep.store.getUsedCapacity(
            RESOURCE_ENERGY
        );

    const freeCapacity =
        creep.store.getFreeCapacity(
            RESOURCE_ENERGY
        );

    if (carriedEnergy === 0) {
        creep.memory.delivering = false;
        creep.say("collect");
    }

    if (freeCapacity === 0) {
        creep.memory.delivering = true;
        creep.say("deliver");
    }
}


/*
 * Withdraws energy from containers positioned
 * beside an energy source.
 */
function collectEnergy(creep) {
    const sourceContainers = creep.room.find(
        FIND_STRUCTURES,
        {
            filter: structure =>
                structure.structureType ===
                    STRUCTURE_CONTAINER &&
                structure.store.getUsedCapacity(
                    RESOURCE_ENERGY
                ) > 0 &&
                isSourceContainer(structure)
        }
    );

    /*
     * When no container currently has energy,
     * deliver any partial load rather than waiting forever.
     */
    if (sourceContainers.length === 0) {
        if (
            creep.store.getUsedCapacity(
                RESOURCE_ENERGY
            ) > 0
        ) {
            creep.memory.delivering = true;
            deliverEnergy(creep);
        }

        return;
    }

    /*
     * Prefer the fullest source container.
     *
     * This helps prevent one source container from
     * overflowing while another is repeatedly selected.
     */
    sourceContainers.sort(
        (containerA, containerB) =>
            containerB.store.getUsedCapacity(
                RESOURCE_ENERGY
            ) -
            containerA.store.getUsedCapacity(
                RESOURCE_ENERGY
            )
    );

    const container = sourceContainers[0];

    const result = creep.withdraw(
        container,
        RESOURCE_ENERGY
    );

    if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(container, {
            reusePath: 20,

            visualizePathStyle: {
                stroke: "#00aaff"
            }
        });
    }
}


/*
 * Returns true when a container is directly beside
 * at least one energy source.
 */
function isSourceContainer(container) {
    const nearbySources = container.pos.findInRange(
        FIND_SOURCES,
        1
    );

    return nearbySources.length > 0;
}


/*
 * Delivery priority:
 *
 * 1. Spawn and extensions
 * 2. Towers
 * 3. Storage
 */
function deliverEnergy(creep) {
    const spawnOrExtension =
        creep.pos.findClosestByPath(
            FIND_MY_STRUCTURES,
            {
                filter: structure =>
                    [
                        STRUCTURE_SPAWN,
                        STRUCTURE_EXTENSION
                    ].includes(
                        structure.structureType
                    ) &&
                    structure.store.getFreeCapacity(
                        RESOURCE_ENERGY
                    ) > 0
            }
        );

    const tower =
        creep.pos.findClosestByPath(
            FIND_MY_STRUCTURES,
            {
                filter: structure =>
                    structure.structureType ===
                        STRUCTURE_TOWER &&
                    structure.store.getFreeCapacity(
                        RESOURCE_ENERGY
                    ) > 0
            }
        );

    const storage =
        creep.pos.findClosestByPath(
            FIND_MY_STRUCTURES,
            {
                filter: structure =>
                    structure.structureType ===
                        STRUCTURE_STORAGE &&
                    structure.store.getFreeCapacity(
                        RESOURCE_ENERGY
                    ) > 0
            }
        );

    const deliveryTarget =
        spawnOrExtension ||
        tower ||
        storage;

    /*
     * Everything is full. Keep the energy until
     * something has room again.
     */
    if (!deliveryTarget) {
        creep.say("full");
        return;
    }

    const result = creep.transfer(
        deliveryTarget,
        RESOURCE_ENERGY
    );

    if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(deliveryTarget, {
            reusePath: 20,

            visualizePathStyle: {
                stroke: "#ffffff"
            }
        });
    }
}


module.exports = roleHauler;