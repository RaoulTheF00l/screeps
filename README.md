# Screeps Colony Automation

A modular JavaScript colony controller for [Screeps](https://screeps.com/), built around autonomous agents, persistent state, resource logistics, infrastructure planning, and failure recovery.

This project began as a practical way to learn JavaScript through a simulation that continues running without direct player control. The colony manages its own workers, distributes energy, constructs infrastructure, protects itself, and reports its current status in real time.

## Project Goals

- Learn JavaScript through a persistent, observable simulation
- Build autonomous systems that can recover from worker losses
- Replace general-purpose workers with specialized colony roles
- Keep the codebase modular, readable, and easy to extend
- Improve energy throughput without destabilizing the colony
- Gradually expand toward multi-room automation

## Current Features

### Colony Management

The colony controller currently supports:

- Automatic creep population tracking
- Configurable population targets
- Explicit role-spawning priorities
- Role-specific creep body templates
- Automatic cleanup of dead creep memory
- Emergency fallback bodies when energy is limited
- Per-creep error handling so one failure does not stop the colony

Population settings and system toggles are stored in:

```text
src/colony/config.js
```

### Specialized Creep Roles

| Role | Responsibility |
|---|---|
| **Harvester** | Harvests energy and supplies essential colony structures |
| **Miner** | Receives a permanent source assignment and mines into a nearby container |
| **Hauler** | Moves energy from source containers to the colony |
| **Builder** | Completes construction projects and upgrades when idle |
| **Upgrader** | Invests energy into the room controller |

Each role exposes a focused `run(creep)` interface and stores its current behavioral state in creep memory.

### Dedicated Energy Logistics

The colony is transitioning from general-purpose harvesting toward a specialized logistics pipeline:

```text
Energy Source
     ↓
Dedicated Miner
     ↓
Source Container
     ↓
Hauler
     ↓
Spawn / Extensions / Towers / Storage
```

This separates energy extraction from transportation. Miners can remain beside their assigned sources while haulers handle movement across the room.

### Miner Source Assignment

Miners receive a source ID when they are spawned.

The population manager balances assignments by selecting the source with the fewest currently assigned miners. Each miner stores that assignment in `creep.memory.sourceId`, avoiding repeated source selection.

When a container is available beside the source, the miner:

1. Moves onto the container
2. Harvests continuously
3. Transfers energy into the container

Before container infrastructure is complete, miners temporarily use direct-delivery behavior.

### Hauler Priorities

Haulers collect energy from containers adjacent to energy sources.

Their delivery order is:

1. Spawns and extensions
2. Towers
3. Storage

Haulers prefer fuller source containers to reduce the chance of a productive container overflowing.

### Automated Road Planning

The road planner uses Screeps `PathFinder` and a custom `CostMatrix` to plan shared routes between:

- Spawns and energy sources
- Spawns and room controllers
- Existing and planned road segments

The planner:

- Stores route plans in room memory
- Recalculates when important room conditions change
- Encourages different routes to share road tiles
- Avoids structures and invalid construction positions
- Allows roads beneath owned ramparts
- Places only a small number of construction sites at a time
- Preserves construction-site capacity for important buildings

Road planning can be enabled or disabled through `src/colony/config.js`.

### Tower Automation

Owned towers follow a clear priority order:

1. Attack hostile creeps
2. Heal injured friendly creeps
3. Repair damaged colony structures

Routine repairs only occur when a tower has sufficient stored energy. Walls and ramparts are excluded from general repair behavior so towers do not consume their defensive reserve maintaining very large hit-point pools.

### Room Diagnostics

The colony draws live information directly onto each controlled room.

Current visual diagnostics include:

- Available and maximum room energy
- Creep counts by role
- Room controller level
- Controller upgrade progress
- Construction-site completion percentages
- Current spawning activity

These visuals make colony behavior easier to inspect without relying entirely on console logs.

## Architecture

The main game loop is intentionally small:

```text
Game Tick
   │
   ├── Remove memory belonging to dead creeps
   ├── Check population targets and spawn missing roles
   ├── Dispatch every creep to its role module
   └── Run systems for each controlled room
          ├── Road planning
          ├── Tower behavior
          └── Room diagnostics
```

Higher-level responsibilities are divided between colony managers:

| Module | Responsibility |
|---|---|
| `colony.config` | Shared population targets, priorities, and feature toggles |
| `colony.population` | Creep counting, body selection, spawning, and source assignment |
| `colony.creeps` | Dead-memory cleanup and role dispatch |
| `colony.rooms` | Execution of room-level systems |
| `main` | Coordinates the managers once per game tick |

## Project Structure

```text
.
├── src/
│   ├── main.js
│   │
│   ├── colony/
│   │   ├── config.js
│   │   ├── creeps.js
│   │   ├── population.js
│   │   └── rooms.js
│   │
│   ├── role/
│   │   ├── builder.js
│   │   ├── harvester.js
│   │   ├── hauler.js
│   │   ├── miner.js
│   │   └── upgrader.js
│   │
│   ├── room/
│   │   ├── roads.js
│   │   ├── towers.js
│   │   └── visuals.js
│   │
│   └── utility/
│       ├── energy.js
│       └── profiler.js
│
├── scripts/
│   └── build.js
│
├── dist/
│   └── Generated Screeps modules
│
├── main.js
├── colony.*.js
├── role.*.js
├── room.*.js
├── utility.*.js
│   └── Generated modules copied to the live Screeps branch
│
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## Source and Generated Files

The organized files inside `src/` are the source of truth.

Screeps expects flat module names such as:

```text
colony.population
role.harvester
room.towers
```

The build script converts the organized source paths into those flat module filenames:

```text
src/colony/population.js
        ↓
dist/colony.population.js
```

```text
src/role/harvester.js
        ↓
dist/role.harvester.js
```

Do not make permanent changes directly inside `dist/` or the generated root modules. Those files can be replaced the next time the project is built.

## Local Setup

Clone the repository and install the development dependencies:

```bash
git clone https://github.com/RaoulTheF00l/screeps.git
cd screeps
npm install
```

The installed packages provide Screeps and Lodash type definitions for compatible editors.

## Building the Screeps Modules

Run:

```bash
npm run build
```

The build script:

1. Deletes the previous `dist/` directory
2. Finds every JavaScript file inside `src/`
3. Converts folder separators into Screeps module names
4. Writes the generated modules into `dist/`

Example build output:

```text
colony/config.js -> colony.config.js
colony/population.js -> colony.population.js
role/harvester.js -> role.harvester.js
room/towers.js -> room.towers.js
main.js -> main.js
```

For the current local Screeps synchronization setup, copy the generated modules into the repository root:

```bash
cp dist/*.js .
```

The complete local build-and-copy command is:

```bash
npm run build && cp dist/*.js .
```

Once synchronized, the Screeps runtime executes the exported loop from `main.js` once per game tick.

## Configuration

Population targets, spawning priorities, and system toggles are stored in:

```js
// src/colony/config.js

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
```

This keeps colony policy separate from implementation details.

Population values are adjusted as infrastructure and room energy capacity develop.

## Design Decisions

### Recovery Before Maximum Efficiency

Harvesters receive the highest spawning priority because the colony requires a working energy supply to recover from losses.

Affordable fallback bodies prevent the spawning system from waiting indefinitely when the room cannot currently afford a larger creep.

### Gradual Logistics Migration

General harvesters remain active while miners, containers, and haulers are introduced.

This avoids replacing the entire economy at once and reduces the risk of an energy collapse during infrastructure changes.

### Explicit Priorities

Spawning, hauling, and tower behavior use clearly defined priority orders.

This makes decisions predictable, easier to debug, and easier to change as the colony develops.

### Persistent State

Creep behavior and room-planning progress are stored in Screeps memory.

Examples include:

- Whether a worker is collecting or performing its job
- Whether a hauler is collecting or delivering
- A miner's assigned source ID
- Cached road-plan positions
- Road construction progress

### Incremental Background Work

The road planner does not create the entire construction queue at once.

It performs planning infrequently and adds only a few road sites during each run, allowing builders to keep pace with the generated work.

### Failure Isolation

Each creep is executed inside its own error boundary.

A broken or unexpected creep state can be reported without preventing every other creep and room system from running during that tick.

## Current Limitations

- Spawn management currently selects the first available spawn
- Builders and upgraders can still harvest directly from sources
- Some room and target searches are repeated more often than necessary
- Source-container discovery is not yet centrally cached
- Creep replacement occurs after death rather than before expiration
- Multi-room room systems exist, but population management is not yet fully room-specific
- Generated modules currently need to be copied into the live synchronization directory manually

## Development Roadmap

- [x] Basic harvester, builder, and upgrader roles
- [x] Automatic creep population management
- [x] Dead-creep memory cleanup
- [x] Tower attack, healing, and repair behavior
- [x] Live room diagnostics
- [x] Automated road planning
- [x] Dedicated miners with source assignments
- [x] Container-based haulers
- [x] Configurable role targets and spawning priorities
- [x] Separate colony, role, room, and utility source folders
- [x] Build script for flat Screeps module names
- [ ] Separate emergency spawning from normal spawning
- [ ] Select normal creep bodies using full room energy capacity
- [ ] Add shared energy-withdrawal behavior
- [ ] Cache creep targets and source-container IDs
- [ ] Add pre-spawning before important creeps expire
- [ ] Improve CPU profiling and performance measurements
- [ ] Add storage-aware colony policies
- [ ] Add room-specific spawn and population managers
- [ ] Support remote mining
- [ ] Support colony expansion into additional rooms
- [ ] Add automated tests for pure decision functions
- [ ] Add linting and continuous-integration checks

## What I Am Learning

This project is a practical exercise in:

- JavaScript functions, objects, arrays, and control flow
- CommonJS modules using `require()` and `module.exports`
- Refactoring a growing codebase into focused modules
- Persistent state and memory management
- Autonomous agent behavior
- State machines
- Priority-based decision systems
- Resource logistics and throughput planning
- Pathfinding and cost matrices
- Cached and incremental background work
- Runtime diagnostics
- Defensive programming
- Error handling and recovery
- Long-running simulation architecture

## Status

This is an active personal learning and portfolio project.

The current focus is improving the architecture and stabilizing the specialized miner-and-hauler economy before expanding into more advanced optimization and multi-room automation.