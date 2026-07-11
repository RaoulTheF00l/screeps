# Screeps Colony Automation

A modular JavaScript colony controller for [Screeps](https://screeps.com/), the persistent programming strategy game.

This project began as a hands-on way to learn JavaScript through a live simulation. The colony currently automates creep population management, resource harvesting, energy logistics, construction, controller upgrades, tower behavior, road planning, and room status visuals.

## Project Goals

- Learn JavaScript through a persistent, observable simulation
- Replace tutorial-style general-purpose creeps with specialized colony roles
- Keep systems modular, readable, and easy to expand
- Improve energy throughput while avoiding sudden colony failures
- Build toward multi-room automation over time

## Current Features

### Specialized Creep Roles

- **Harvester** — collects energy and keeps essential structures supplied
- **Miner** — receives a permanent source assignment and mines into a nearby container
- **Hauler** — transports energy from source containers to colony structures
- **Builder** — constructs extensions, containers, roads, and other planned structures
- **Upgrader** — delivers energy to the room controller

### Colony Management

- Automatic creep population tracking
- Role-based spawning priorities
- Role-specific creep bodies
- Automatic cleanup of dead creep memory
- Emergency general-purpose workers kept during the logistics transition

### Energy Logistics

The developing colony economy follows this pipeline:

```text
Energy Source
     ↓
Dedicated Miner
     ↓
Source Container
     ↓
Hauler
     ↓
Spawn / Extensions / Tower / Storage
```

This separates harvesting from transportation so miners spend less time walking and more time extracting energy.

### Automated Road Planning

The road planner uses Screeps `PathFinder` to create efficient shared routes between:

- Spawn and energy sources
- Spawn and controller
- Existing and planned road segments

Road construction is throttled so builders are not overwhelmed and the global construction-site limit is preserved.

### Tower Automation

Towers automatically prioritize:

1. Hostile creeps
2. Injured friendly creeps
3. Damaged colony structures

### Room Visuals

The colony draws live room information directly onto the game map, including:

- Available and maximum room energy
- Creep counts by role
- Controller level and upgrade progress
- Construction-site completion percentages

## Project Structure

```text
.
├── main.js               # Main game loop, spawning, and role dispatch
├── role.harvester.js     # General-purpose energy harvesting
├── role.miner.js         # Dedicated source mining
├── role.hauler.js        # Container-to-base energy transport
├── role.builder.js       # Construction behavior
├── role.upgrader.js      # Controller upgrading
├── room.roads.js         # Automated route planning and road placement
├── room.towers.js        # Tower defense, healing, and repair logic
├── room.visuals.js       # On-map colony status display
├── package.json          # Local development dependencies
└── .gitignore            # Files excluded from version control
```

## How the Main Loop Works

Each game tick, `main.js` runs the colony systems in a predictable order:

```text
Clean dead creep memory
        ↓
Check and spawn missing roles
        ↓
Plan road construction
        ↓
Run every creep role
        ↓
Run tower behavior
        ↓
Draw room visuals
```

Keeping these responsibilities separate makes the project easier to debug and expand.

## Design Decisions

### Gradual Logistics Migration

The colony keeps several ordinary harvesters active while miners and haulers are introduced. This avoids replacing the entire economy at once and reduces the risk of an energy collapse.

### Permanent Miner Assignments

Each miner stores a source ID in creep memory. This prevents repeated source searches and ensures miners remain distributed between available sources.

### Controlled Construction

The road planner creates only a small number of sites at a time. Builders can finish important structures without being buried beneath a large road queue.

### Modular Roles

Each creep role lives in its own file and exposes a simple `run(creep)` interface. The main loop decides which module to call based on the creep's memory.

## Running the Project

This repository contains the scripts used by the Screeps runtime.

1. Clone the repository:

   ```bash
   git clone https://github.com/RaoulTheF00l/screeps.git
   cd screeps
   ```

2. Install local development dependencies:

   ```bash
   npm install
   ```

3. Copy or upload the JavaScript modules into a Screeps code branch.

4. Make sure the module names in Screeps match the filenames used by `require()`.

The game itself runs the exported loop from `main.js` once per tick.

## Development Roadmap

- [x] Basic harvester, builder, and upgrader roles
- [x] Automated creep population management
- [x] Tower automation
- [x] Room status visuals
- [x] Automated road planning
- [x] Dedicated miners with source assignments
- [x] Container-based haulers
- [ ] Complete the source-container logistics network
- [ ] Scale creep bodies using full room energy capacity
- [ ] Add storage-aware colony policies
- [ ] Add creep replacement before expiration
- [ ] Improve CPU profiling and path reuse
- [ ] Support multiple spawns and owned rooms
- [ ] Add remote mining and room expansion

## What I Am Learning

This project is being developed as a practical JavaScript learning exercise. It has helped me practice:

- CommonJS modules with `require()` and `module.exports`
- Objects, arrays, loops, conditionals, and functions
- State machines stored in creep memory
- Pathfinding and cost matrices
- Priority-based task selection
- Resource logistics and throughput planning
- Defensive programming and runtime error handling
- Refactoring a growing codebase into focused modules

## Status

Active learning project. The current focus is stabilizing the RCL 4 energy economy with dedicated miners, source containers, and haulers before moving into larger-scale colony automation.
