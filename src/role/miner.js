const roleMiner = {
    run(creep) {
        const source = Game.getObjectById(
            creep.memory.sourceId
        );

        if (!source) {
            console.log(
                `${creep.name} does not have a valid source assignment.`
            );

            return;
        }

        const container = source.pos.findInRange(
            FIND_STRUCTURES,
            1,
            {
                filter: structure =>
                    structure.structureType ===
                    STRUCTURE_CONTAINER
            }
        )[0];

        /*
         * When there is room in an adjacent container,
         * the miner stands on it and mines continuously.
         */
        if (container) {
            mineIntoContainer(
            creep,
            source,
            container
        );

    return;
}

        /*
         * Until a container exists—or while it is full—
         * the miner harvests and delivers energy normally.
         */
        harvestAndDeliver(
            creep,
            source
        );
    }
};


/*
 * Moves the miner onto the source container and
 * continuously fills it.
 */
function mineIntoContainer(
    creep,
    source,
    container
) {
    if (!creep.pos.isEqualTo(container.pos)) {
        creep.moveTo(container, {
            reusePath: 20,

            visualizePathStyle: {
                stroke: "#ffaa00"
            }
        });

        return;
    }

    const harvestResult = creep.harvest(source);

    if (
        harvestResult !== OK &&
        harvestResult !== ERR_NOT_ENOUGH_RESOURCES &&
        harvestResult !== ERR_FULL
    ) {
        console.log(
            `${creep.name} could not harvest: ${harvestResult}`
        );
    }

    if (
        creep.store.getUsedCapacity(
            RESOURCE_ENERGY
        ) > 0
    ) {
        const transferResult = creep.transfer(
            container,
            RESOURCE_ENERGY
        );

        if (
            transferResult !== OK &&
            transferResult !== ERR_FULL
        ) {
            console.log(
                `${creep.name} could not fill container: ${transferResult}`
            );
        }
    }
}


/*
 * Temporary behavior used before the source has
 * a working container.
 */
function harvestAndDeliver(
    creep,
    source
) {
    const carriedEnergy =
        creep.store.getUsedCapacity(
            RESOURCE_ENERGY
        );

    const freeCapacity =
        creep.store.getFreeCapacity(
            RESOURCE_ENERGY
        );

    /*
     * Continue harvesting while the miner has room.
     */
    if (freeCapacity > 0) {
        const harvestResult = creep.harvest(source);

        if (harvestResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {
                reusePath: 10,

                visualizePathStyle: {
                    stroke: "#ffaa00"
                }
            });
        }

        return;
    }

    /*
     * The miner should normally have energy here,
     * but this prevents unnecessary target searches.
     */
    if (carriedEnergy === 0) {
        return;
    }

    const deliveryTarget =
        creep.pos.findClosestByPath(
            FIND_MY_STRUCTURES,
            {
                filter: structure => {
                    const acceptsEnergy = [
                        STRUCTURE_SPAWN,
                        STRUCTURE_EXTENSION,
                        STRUCTURE_TOWER,
                        STRUCTURE_STORAGE
                    ].includes(
                        structure.structureType
                    );

                    return (
                        acceptsEnergy &&
                        structure.store.getFreeCapacity(
                            RESOURCE_ENERGY
                        ) > 0
                    );
                }
            }
        );

    if (!deliveryTarget) {
        return;
    }

    const transferResult = creep.transfer(
        deliveryTarget,
        RESOURCE_ENERGY
    );

    if (transferResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(deliveryTarget, {
            reusePath: 10,

            visualizePathStyle: {
                stroke: "#ffffff"
            }
        });
    }
}


module.exports = roleMiner;