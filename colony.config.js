const ROLE_TARGETS = {
    harvester: 6,
    miner: 0,
    hauler: 0,
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