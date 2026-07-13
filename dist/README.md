# Screeps Colony Automation

A modular JavaScript colony controller for **Screeps**, built around autonomous creep roles, recovery-focused spawning, infrastructure planning, defensive towers, and live room diagnostics.

This project is a continuing exercise in designing persistent systems that must manage resources, recover from losses, and make decisions over thousands of game ticks without direct player control.

## Project Overview

The colony is controlled through a central game loop in `main.js`.

Each tick, the controller:

1. Removes memory belonging to dead creeps.
2. Checks whether the colony needs replacement creeps.
3. Expands the room's road network incrementally.
4. dispatches each creep to its assigned role module.
5. Runs defensive and maintenance towers.
6. Draws live colony information inside the room.

```text
Game tick
   │
   ├── Clean dead creep memory
   ├── Maintain creep population
   ├── Run road planners
   ├── Execute creep roles
   ├── Run tower priorities
   └── Draw room diagnostics
```

## Current Features

### Automated Population Management

The spawn manager counts living creeps and creates replacements according to configurable role targets.

The current active colony composition is:

| Role      | Target | Responsibility                     |
| --------- | -----: | ---------------------------------- |
| Harvester |      4 | Harvest and distribute room energy |
| Upgrader  |      1 | Upgrade the room controller        |
| Builder   |      1 | Complete construction projects     |

Harvesters receive first priority because the colony cannot recover without an active energy supply.

Creep bodies scale according to currently available energy:

| Available energy | Body                                             |
| ---------------: | ------------------------------------------------ |
|          200–299 | `WORK`, `CARRY`, `MOVE`                          |
|          300–399 | `WORK`, `CARRY`, `CARRY`, `MOVE`, `MOVE`         |
|             400+ | `WORK`, `WORK`, `CARRY`, `CARRY`, `MOVE`, `MOVE` |

The 200-energy fallback allows the colony to rebuild after a severe population loss instead of waiting indefinitely for a larger body.

### Harvester Behavior

Harvesters alternate between collecting and delivering energy.

Delivery targets include:

1. Spawns
2. Extensions
3. Towers

When all eligible structures are full, harvesters use their remaining energy to help upgrade the room controller rather than remaining idle.

### Builder Behavior

Builders alternate between collecting energy and completing construction sites.

When no construction work remains, builders temporarily assist with controller upgrades. This gives them useful fallback behavior while preserving their primary construction responsibility.

### Upgrader Behavior

Upgraders harvest from active energy sources and continuously invest that energy into the room controller.

Their working state is stored in creep memory so they can switch between gathering and upgrading without losing their current behavior between ticks.

## Road Planning

`room.roads.js` creates and maintains routes between the room's spawn, energy sources, and controller.

The planner:

* Uses `PathFinder` and a custom `CostMatrix`
* Accounts for terrain, structures, construction sites, minerals, and room objects
* Encourages later paths to reuse already planned road tiles
* Avoids duplicate road positions
* Allows roads beneath owned ramparts
* Stores its plan and progress in room memory
* Recalculates when important room conditions change
* Places construction sites gradually instead of flooding the room

### Planner Limits

The current planner configuration:

| Setting                             |          Value |
| ----------------------------------- | -------------: |
| Planning interval                   | Every 25 ticks |
| New road sites per run              |              2 |
| Maximum pending road sites          |              8 |
| Global construction-site soft limit |             90 |

These limits prevent road construction from overwhelming builders or consuming all available construction-site slots.

### Cached Room Signatures

Each road plan is associated with a signature generated from:

* Spawn ID
* Controller ID
* Controller level
* Energy source IDs

When that signature changes, the planner generates a new route plan and resets its construction cursor.

## Tower Management

`room.towers.js` gives every owned tower a clear priority order:

1. Attack hostile creeps
2. Heal injured friendly creeps
3. Repair heavily damaged structures

Towers only perform routine repairs when they contain at least 500 energy. This preserves a defensive reserve for attacks and emergency healing.

Walls and ramparts are excluded from automatic repair so towers do not consume their entire energy supply maintaining structures with extremely large hit-point limits.

## Room Diagnostics

`room.visuals.js` displays live colony information directly inside each controlled room.

The current display includes:

* Available and maximum room energy
* Creep counts by role
* Room controller level
* Controller upgrade progress
* Construction-site completion percentages

These diagnostics make it easier to inspect colony behavior without relying entirely on console output.

## Dedicated Mining and Logistics

The repository also contains dedicated miner and hauler modules that are implemented but not yet connected to the active spawn and role-dispatch system.

### Miner Module

`role.miner.js` supports:

* Persistent source assignment through `creep.memory.sourceId`
* Detecting containers adjacent to assigned sources
* Moving onto source containers
* Continuous stationary harvesting
* Transferring harvested energy into containers
* Temporary direct-delivery behavior before containers are available

### Hauler Module

`role.hauler.js` supports:

* Finding containers located beside energy sources
* Selecting the fullest available source container
* Withdrawing stored energy
* Switching between collection and delivery states
* Delivering partial loads when no more container energy is available

Hauler delivery priority is:

1. Spawns and extensions
2. Towers
3. Storage

Integrating these modules will allow the colony to move from general-purpose harvesting toward a more specialized mining and logistics economy.

## Project Structure

```text
screeps/
├── main.js
│   └── Central game loop, population management, and role dispatch
│
├── role.harvester.js
│   └── General energy harvesting and structure delivery
│
├── role.upgrader.js
│   └── Controller upgrading behavior
│
├── role.builder.js
│   └── Construction behavior with controller fallback
│
├── role.miner.js
│   └── Assigned-source and container-based mining
│
├── role.hauler.js
│   └── Container collection and prioritized energy delivery
│
├── room.roads.js
│   └── Cached, incremental road-network planning
│
├── room.towers.js
│   └── Tower attack, healing, and repair priorities
│
├── room.visuals.js
│   └── Live room status and construction diagnostics
│
├── package.json
│   └── Screeps and Lodash type definitions
│
└── .gitignore
    └── Local packages, credentials, logs, and editor files
```

## Module Status

| Module              | Status                           |
| ------------------- | -------------------------------- |
| `main.js`           | Active                           |
| `role.harvester.js` | Active                           |
| `role.upgrader.js`  | Active                           |
| `role.builder.js`   | Active                           |
| `room.roads.js`     | Active                           |
| `room.towers.js`    | Active                           |
| `room.visuals.js`   | Active                           |
| `role.miner.js`     | Implemented; integration pending |
| `role.hauler.js`    | Implemented; integration pending |

## Running the Project

The scripts are intended to run inside the Screeps JavaScript environment.

### Editor Setup

Clone the repository and install the included type definitions:

```bash
git clone https://github.com/RaoulTheF00l/screeps.git
cd screeps
npm install
```

The installed packages provide Screeps and Lodash type information for compatible editors. They are development dependencies and are not part of the uploaded game code.

### Screeps Setup

Upload or create modules using the same filenames found in this repository:

```text
main
role.harvester
role.upgrader
role.builder
role.miner
role.hauler
room.roads
room.towers
room.visuals
```

`main.js` is the entry point used by the Screeps runtime.

The repository does not currently include an automatic deployment script, so files must be uploaded through the Screeps interface or through a separately configured synchronization tool.

## Technical Focus

This project demonstrates practical work with:

* Modular JavaScript architecture
* Persistent game state
* Autonomous agent behavior
* Priority-based decision systems
* Recovery and fallback logic
* Resource distribution
* Role-based task execution
* Pathfinding and cost matrices
* Cached planning data
* Incremental background work
* Runtime diagnostics
* Defensive automation
* Guard clauses and error handling
* Long-running simulation code

## Design Priorities

### Recovery Before Optimization

The colony always prioritizes maintaining enough harvesters to recover its energy economy. Affordable creep bodies are available when the room cannot support a larger design.

### Useful Fallback Behavior

Creeps attempt secondary work when their main task is unavailable:

* Harvesters upgrade when structures are full.
* Builders upgrade when no construction sites exist.
* Miners can deliver directly before container infrastructure is ready.
* Haulers preserve carried energy when no structure can receive it.

### Incremental Construction

Road sites are created a few at a time. This avoids filling the construction queue and allows builders to keep pace with planned infrastructure.

### Persistent Planning

Road plans and progress cursors are stored in room memory. The colony does not perform expensive route calculations every tick or lose its progress when the main loop restarts.

### Clear Priorities

Spawning, hauling, and tower behavior use explicit priority orders. This makes their decisions predictable and easier to debug.

## Current Development

The next major development step is integrating the dedicated miner and hauler modules into the active colony manager.

That work will require:

* Assigning miners to specific energy sources
* Generating role-specific creep bodies
* Adding miner and hauler population targets
* Dispatching both roles from the central loop
* Preserving emergency harvester recovery behavior
* Handling rooms before source containers are complete
* Balancing container income against hauling capacity

Additional planned improvements include:

* Extracting spawn configuration into its own module
* Adding role-specific body templates
* Improving energy collection for builders and upgraders
* Adding automated tests for pure decision functions
* Adding linting and continuous-integration checks
* Expanding support for multiple rooms
* Improving defensive behavior and rampart maintenance

## Why I Built This

Screeps provides a useful environment for practicing software development because the program must continue operating without constant manual input.

A colony can lose workers, run out of energy, accumulate too many construction projects, waste tower energy, or become trapped in ineffective behavior. Building this controller requires thinking about priorities, state transitions, resource flow, recovery, pathfinding, performance, and maintainable program structure.

The goal of this repository is not only to progress through the game, but to gradually develop a colony controller that is understandable, modular, observable, and capable of recovering from failures.

## Project Status

This is an active personal learning and portfolio project.

The current colony supports automated spawning, three active creep roles, road-network construction, tower management, memory cleanup, and live room diagnostics. Dedicated mining and hauling systems are present and are the next major integration milestone.
