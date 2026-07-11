const SETTINGS = {
    // Only run the road planner once every 25 ticks.
    RUN_EVERY: 25,

    // Create at most this many new road sites per run.
    SITES_PER_RUN: 2,

    // Wait for builders when this many road sites are already pending.
    MAX_PENDING_ROAD_SITES: 8,

    // Screeps allows 100 total construction sites.
    // Stopping at 90 leaves room for extensions, towers, and other buildings.
    GLOBAL_SITE_SOFT_LIMIT: 90
};

module.exports = {
    run(room) {
        if (!room || !room.controller || !room.controller.my) {
            return;
        }

        if (Game.time % SETTINGS.RUN_EVERY !== 0) {
            return;
        }

        const spawn = room.find(FIND_MY_SPAWNS)[0];

        if (!spawn) {
            return;
        }

        const sources = room.find(FIND_SOURCES);
        const controller = room.controller;

        if (!room.memory.roadPlanner) {
            room.memory.roadPlanner = {};
        }

        const plannerMemory = room.memory.roadPlanner;

        /*
         * The signature lets us detect important room changes.
         *
         * The plan will be recalculated when:
         * - the spawn changes;
         * - the controller changes level;
         * - the room's sources change.
         */
        const signature = createRoomSignature(
            spawn,
            sources,
            controller
        );

        if (
            !plannerMemory.plan ||
            plannerMemory.signature !== signature
        ) {
            plannerMemory.plan = createRoadPlan(
                room,
                spawn,
                sources,
                controller
            );

            plannerMemory.signature = signature;
            plannerMemory.cursor = 0;

            console.log(
                `[RoadPlanner] Planned ${plannerMemory.plan.length} road tiles in ${room.name}.`
            );
        }

        placeNextRoadSites(room, plannerMemory);
    },

    /*
     * This can be used when you want to force the room to make
     * a completely new road plan.
     */
    reset(room) {
        if (!room) {
            return;
        }

        delete room.memory.roadPlanner;
    }
};

/**
 * Creates an identifier for the current room layout.
 */
function createRoomSignature(spawn, sources, controller) {
    const sourceIds = sources
        .map(source => source.id)
        .sort()
        .join(",");

    return [
        spawn.id,
        controller.id,
        controller.level,
        sourceIds
    ].join("|");
}

/**
 * Creates the complete list of planned road positions.
 */
function createRoadPlan(room, spawn, sources, controller) {
    const costMatrix = createCostMatrix(room);

    const plannedTiles = [];
    const seenTiles = {};

    /*
     * The spawn itself is normally marked as blocked because creeps
     * cannot walk through it. We temporarily make it usable as the
     * starting position for PathFinder.
     */
    costMatrix.set(spawn.pos.x, spawn.pos.y, 1);

    /*
     * Plan closer sources first. Later paths are encouraged to reuse
     * previously planned roads.
     */
    const sortedSources = sources.slice().sort((sourceA, sourceB) => {
        const rangeA = spawn.pos.getRangeTo(sourceA.pos);
        const rangeB = spawn.pos.getRangeTo(sourceB.pos);

        return rangeA - rangeB;
    });

    // Spawn -> every source
    for (const source of sortedSources) {
        addPathToPlan(
            room,
            spawn.pos,
            source.pos,
            costMatrix,
            plannedTiles,
            seenTiles,
            `source ${source.id}`
        );
    }

    // Spawn -> controller
    addPathToPlan(
        room,
        spawn.pos,
        controller.pos,
        costMatrix,
        plannedTiles,
        seenTiles,
        "controller"
    );

    return plannedTiles;
}

/**
 * Finds one path and adds its tiles to the shared road plan.
 */
function addPathToPlan(
    room,
    startPosition,
    targetPosition,
    costMatrix,
    plannedTiles,
    seenTiles,
    targetName
) {
    const result = PathFinder.search(
        startPosition,
        {
            pos: targetPosition,

            /*
             * Sources and controllers cannot have roads placed directly
             * on them, so the path stops on an adjacent tile.
             */
            range: 1
        },
        {
            /*
             * Roads are cheapest. Plains are normal. Swamps are expensive.
             * This creates fast routes rather than blindly choosing the
             * path with the fewest total squares.
             */
            plainCost: 2,
            swampCost: 10,
            maxRooms: 1,

            roomCallback(roomName) {
                if (roomName !== room.name) {
                    return false;
                }

                return costMatrix;
            }
        }
    );

    if (result.incomplete) {
        console.log(
            `[RoadPlanner] Could not find a complete route to ${targetName} in ${room.name}.`
        );

        return;
    }

    for (const position of result.path) {
        const tileKey = `${position.x}:${position.y}`;

        /*
         * A tile may appear in multiple routes. Store it only once.
         */
        if (!seenTiles[tileKey]) {
            seenTiles[tileKey] = true;

            plannedTiles.push({
                x: position.x,
                y: position.y
            });
        }

        /*
         * Mark this planned tile as inexpensive. Routes calculated
         * afterward will prefer joining this road instead of creating
         * an entirely separate road.
         */
        costMatrix.set(position.x, position.y, 1);
    }
}

/**
 * Creates the PathFinder cost map.
 *
 * 1 means very desirable.
 * 255 means completely blocked.
 */
function createCostMatrix(room) {
    const costs = new PathFinder.CostMatrix();

    const structures = room.find(FIND_STRUCTURES);

    for (const structure of structures) {
        if (structure.structureType === STRUCTURE_ROAD) {
            costs.set(
                structure.pos.x,
                structure.pos.y,
                1
            );

            continue;
        }

        /*
         * Our ramparts are walkable, and a road can exist beneath
         * a rampart.
         */
        if (
            structure.structureType === STRUCTURE_RAMPART &&
            structure.my
        ) {
            costs.set(
                structure.pos.x,
                structure.pos.y,
                2
            );

            continue;
        }

        /*
         * Spawns, extensions, containers, towers, walls, and other
         * structures should not be selected as road positions.
         */
        costs.set(
            structure.pos.x,
            structure.pos.y,
            255
        );
    }

    const constructionSites = room.find(FIND_CONSTRUCTION_SITES);

    for (const site of constructionSites) {
        if (site.structureType === STRUCTURE_ROAD) {
            costs.set(site.pos.x, site.pos.y, 1);
        } else {
            costs.set(site.pos.x, site.pos.y, 255);
        }
    }

    /*
     * PathFinder uses terrain and our CostMatrix, so explicitly mark
     * room objects that cannot be walked through.
     */
    const sources = room.find(FIND_SOURCES);

    for (const source of sources) {
        costs.set(source.pos.x, source.pos.y, 255);
    }

    const minerals = room.find(FIND_MINERALS);

    for (const mineral of minerals) {
        costs.set(mineral.pos.x, mineral.pos.y, 255);
    }

    if (room.controller) {
        costs.set(
            room.controller.pos.x,
            room.controller.pos.y,
            255
        );
    }

    return costs;
}

/**
 * Gradually turns planned tiles into road construction sites.
 */
function placeNextRoadSites(room, plannerMemory) {
    const plan = plannerMemory.plan;

    if (!plan || plan.length === 0) {
        return;
    }

    const globalSiteCount = Object.keys(
        Game.constructionSites
    ).length;

    if (globalSiteCount >= SETTINGS.GLOBAL_SITE_SOFT_LIMIT) {
        return;
    }

    const pendingRoadSites = room.find(
        FIND_MY_CONSTRUCTION_SITES,
        {
            filter: site =>
                site.structureType === STRUCTURE_ROAD
        }
    ).length;

    /*
     * Let the builders catch up before adding more work.
     */
    if (
        pendingRoadSites >=
        SETTINGS.MAX_PENDING_ROAD_SITES
    ) {
        return;
    }

    const availablePendingSlots =
        SETTINGS.MAX_PENDING_ROAD_SITES -
        pendingRoadSites;

    const availableGlobalSlots =
        SETTINGS.GLOBAL_SITE_SOFT_LIMIT -
        globalSiteCount;

    const sitesToCreate = Math.min(
        SETTINGS.SITES_PER_RUN,
        availablePendingSlots,
        availableGlobalSlots
    );

    if (
        typeof plannerMemory.cursor !== "number" ||
        plannerMemory.cursor >= plan.length
    ) {
        plannerMemory.cursor = 0;
    }

    let createdSites = 0;
    let checkedTiles = 0;

    /*
     * Search through the plan until we create the allowed number
     * of sites or inspect the entire plan.
     */
    while (
        createdSites < sitesToCreate &&
        checkedTiles < plan.length
    ) {
        const tile = plan[plannerMemory.cursor];

        plannerMemory.cursor =
            (plannerMemory.cursor + 1) % plan.length;

        checkedTiles++;

        if (!tileNeedsRoad(room, tile.x, tile.y)) {
            continue;
        }

        const result = room.createConstructionSite(
            tile.x,
            tile.y,
            STRUCTURE_ROAD
        );

        if (result === OK) {
            createdSites++;
        }

        if (result === ERR_FULL) {
            break;
        }
    }
}

/**
 * Returns true only when a road can reasonably be placed here.
 */
function tileNeedsRoad(room, x, y) {
    const structures = room.lookForAt(
        LOOK_STRUCTURES,
        x,
        y
    );

    for (const structure of structures) {
        if (structure.structureType === STRUCTURE_ROAD) {
            return false;
        }

        /*
         * Roads are allowed beneath our existing ramparts.
         */
        if (
            structure.structureType === STRUCTURE_RAMPART &&
            structure.my
        ) {
            continue;
        }

        return false;
    }

    const sites = room.lookForAt(
        LOOK_CONSTRUCTION_SITES,
        x,
        y
    );

    /*
     * Do not place another site when this tile already has one.
     */
    if (sites.length > 0) {
        return false;
    }

    return true;
}