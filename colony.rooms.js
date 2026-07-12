const TowerManager = require("room.towers");
const roomVisuals = require("room.visuals");
const RoadPlanner = require("room.roads");

const {
    ROAD_PLANNER_ENABLED
} = require("colony.config");

function run() {
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];

        if (!isOwnedRoom(room)) {
            continue;
        }

        runRoomSystems(room);
    }
}

function isOwnedRoom(room) {
    return (
        room.controller &&
        room.controller.my
    );
}

function runRoomSystems(room) {
    if (ROAD_PLANNER_ENABLED) {
        RoadPlanner.run(room);
    }

    TowerManager.run(room);
    roomVisuals.run(room);
}

module.exports = {
    run
};