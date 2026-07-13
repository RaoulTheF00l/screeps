const ROLE_TARGETS = {
    harvester: 3,
    miner: 1,
    hauler: 1,
    upgrader: 1,
    builder: 1
};

const SPAWN_PRIORITY = [
    "harvester",
    "miner",
    "hauler",
    "upgrader",
    "builder"
];

const ROAD_PLANNER_ENABLED = false;

module.exports = {
    ROLE_TARGETS,
    SPAWN_PRIORITY,
    ROAD_PLANNER_ENABLED
};