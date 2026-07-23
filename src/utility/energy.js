/*
 * Shared energy collection behavior for worker creeps.
 *
 * Priority:
 * 1. Withdraw from a container beside an energy source.
 * 2. Harvest directly as an emergency fallback.
 */
function collect(creep) {
  const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (structure) =>
      structure.structureType === STRUCTURE_CONTAINER &&
      structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0 &&
      isSourceContainer(structure),
  });

  if (container) {
    const result = creep.withdraw(container, RESOURCE_ENERGY);

    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(container, {
        reusePath: 10,

        visualizePathStyle: {
          stroke: "#00aaff",
        },
      });
    }

    return;
  }

  harvestFromSource(creep);
}

/*
 * Returns true when the container is directly beside
 * an energy source.
 */
function isSourceContainer(container) {
  const nearbySources = container.pos.findInRange(FIND_SOURCES, 1);

  return nearbySources.length > 0;
}

/*
 * Fallback behavior used when no source container
 * currently contains energy.
 */
function harvestFromSource(creep) {
  const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

  if (!source) {
    return;
  }

  const result = creep.harvest(source);

  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(source, {
      reusePath: 10,

      visualizePathStyle: {
        stroke: "#00ff88",
      },
    });
  }
}

module.exports = {
  collect,
};
