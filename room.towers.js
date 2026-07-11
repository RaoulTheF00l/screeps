// room.towers.js

const TowerManager = {
    run(room) {
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: structure =>
                structure.structureType === STRUCTURE_TOWER
        });

        for (const tower of towers) {
            this.runTower(tower, room);
        }
    },

    runTower(tower, room) {
        // Priority 1: Attack enemies
        const hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        if (hostile) {
            tower.attack(hostile);
            return;
        }

        // Priority 2: Heal friendly creeps
        const injuredCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: creep => creep.hits < creep.hitsMax
        });

        if (injuredCreep) {
            tower.heal(injuredCreep);
            return;
        }

        // Priority 3: Repair badly damaged structures
        // The low limit prevents the tower from wasting all its energy.
        if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < 500) {
            return;
        }

        const damagedStructure = tower.pos.findClosestByRange(
            FIND_STRUCTURES,
            {
                filter: structure =>
                    structure.hits < structure.hitsMax * 0.5 &&
                    structure.structureType !== STRUCTURE_WALL &&
                    structure.structureType !== STRUCTURE_RAMPART
            }
        );

        if (damagedStructure) {
            tower.repair(damagedStructure);
        }
    }
};

module.exports = TowerManager;