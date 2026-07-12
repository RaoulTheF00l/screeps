# Adventure Land Party Automation

A modular JavaScript automation system for coordinating a four-character party in [Adventure Land](https://adventure.land/).

The project manages character startup, party formation, combat behavior, healing, movement, inventory logistics, town runs, item progression, and merchant support through a shared, configuration-driven architecture.

## Project Overview

Instead of maintaining a separate copy of the entire automation script for every character, this project uses a shared runtime:

1. `PartyBoot` starts the configured party members.
2. Each character loads `PartyRunner`.
3. `PartyRunner` loads and validates the shared modules.
4. The character reads its settings from `Config`.
5. A single main loop routes behavior according to the character's assigned role.

This structure keeps shared systems reusable while allowing each party member to behave differently.

## Current Features

### Party Management

* Starts the full party from one boot script
* Maintains the configured party composition
* Assigns one character as the party leader
* Uses shared configuration data for every character
* Prevents duplicate main loops after script reloads
* Automatically handles character recovery and respawning

### Coordinated Combat

* Configurable monster targeting
* Leader-controlled target selection
* Party members assist the leader's active target
* Range and cooldown validation before attacks
* Movement into attack range
* Protection against attacking invalid or unintended targets

### Class-Specific Roles

#### Mage

* Serves as the current party leader
* Selects combat targets
* Controls the party's farming destination
* Uses offensive combat behavior

#### Priest

* Monitors the health of every party member
* Prioritizes the party member with the lowest health percentage
* Uses separate self-healing and party-healing thresholds
* Moves into healing range when necessary
* Assists the leader in combat when healing is not required

#### Ranger

* Follows the party leader
* Assists with the leader's selected target
* Maintains configurable combat and following distances
* Uses ranged combat behavior

#### Merchant

* Receives selected loot from combat characters
* Responds to potion and inventory assistance requests
* Restocks party supplies
* Performs independent town runs
* Sells configured items
* Returns to the farming location after completing support work
* Uses merchant skills such as `mluck` when available

## Inventory and Item Progression

The project includes systems for:

* Looting nearby chests
* Counting item quantities
* Tracking available inventory space
* Detecting low potion supplies
* Sending approved loot to the merchant
* Protecting equipment, scrolls, boosters, and other important items from accidental transfers
* Automatically compounding whitelisted accessories
* Automatically upgrading whitelisted equipment
* Enforcing configurable maximum item levels
* Preserving a minimum amount of gold before performing upgrades
* Preventing overlapping asynchronous item actions

Item progression uses explicit allowlists instead of attempting to upgrade every item automatically.

## Movement and Town Behavior

Shared movement and town modules handle:

* Following the party leader
* Maintaining configurable party distances
* Moving into combat or healing range
* Traveling to configured farming locations
* Traveling to vendors and upgrade locations
* Coordinating town requests
* Restocking potions
* Selling configured inventory
* Returning the party to its farming route

## Configuration-Driven Design

Party and character behavior is defined in `Config.3.js`.

Each character can have individual settings for:

* Role
* Target monster
* Main-loop frequency
* Attack behavior
* Potion thresholds
* Healing thresholds
* Follow distance
* Town behavior
* Merchant support
* Item sell lists
* Upgrade allowlists
* Compound allowlists
* Gold reserves
* Inventory limits

This allows behavior to be adjusted without rewriting the shared modules.

## Party Composition

| Character     | Role          | Primary Responsibility                        |
| ------------- | ------------- | --------------------------------------------- |
| `MageRao`     | Mage / Leader | Target selection and offensive combat         |
| `PriestRao`   | Priest        | Party healing and combat support              |
| `RangerRao`   | Ranger        | Ranged damage and leader assistance           |
| `MerchantRao` | Merchant      | Inventory, supplies, selling, and progression |

## Project Structure

```text
adventureland_scripts/
├── README.md
├── data.json
└── adventureland/
    ├── characters/
    │   └── Character-specific exported code
    │
    ├── codes/
    │   ├── PartyBoot.1.js
    │   ├── PartyRunner.2.js
    │   ├── Config.3.js
    │   ├── Core.4.js
    │   ├── Party.5.js
    │   ├── Movement.6.js
    │   ├── Combat.7.js
    │   ├── Inventory.8.js
    │   ├── RolePriest.9.js
    │   ├── RoleRanger.10.js
    │   ├── RoleMage.11.js
    │   ├── ItemProgression.12.js
    │   ├── Town.13.js
    │   ├── Status.14.js
    │   ├── RoleMerchant.15.js
    │   ├── SanityCheck.16.js
    │   ├── Gear.17.js
    │   └── KillTracker.18.js
    │
    └── libraries/
        ├── common_functions.js
        ├── default_code.js
        ├── runner_compat.js
        └── runner_functions.js
```

## Module Responsibilities

| Module            | Responsibility                                          |
| ----------------- | ------------------------------------------------------- |
| `PartyBoot`       | Starts each party character and loads the shared runner |
| `PartyRunner`     | Loads modules and runs the central character loop       |
| `Config`          | Stores party-wide and character-specific settings       |
| `Core`            | Handles shared survival and runtime behavior            |
| `Party`           | Maintains party membership and coordination             |
| `Movement`        | Handles following, positioning, and travel              |
| `Combat`          | Selects, validates, approaches, and attacks targets     |
| `Inventory`       | Handles looting and inventory helper functions          |
| `RolePriest`      | Selects healing targets and supports combat             |
| `RoleRanger`      | Controls ranged party-assist behavior                   |
| `RoleMage`        | Controls leader and mage-specific behavior              |
| `ItemProgression` | Compounds and upgrades approved items                   |
| `Town`            | Coordinates selling, restocking, and town travel        |
| `Status`          | Displays runtime and party information                  |
| `RoleMerchant`    | Manages supplies, loot transfers, and merchant work     |
| `SanityCheck`     | Validates expected configuration and dependencies       |
| `Gear`            | Evaluates and equips approved gear                      |
| `KillTracker`     | Experiments with tracking defeated targets              |

## Runtime Flow

The shared loop processes behavior in a deliberate order:

```text
Handle death or respawn
        ↓
Loot nearby chests
        ↓
Use potions when needed
        ↓
Maintain the party
        ↓
Update movement
        ↓
Request merchant support
        ↓
Handle town work
        ↓
Run class-specific behavior
```

Urgent survival, inventory, and town behavior can therefore interrupt normal combat when necessary.

## Running the Scripts

These scripts are designed for Adventure Land's in-game code system.

1. Import or create the code slots listed in `data.json`.
2. Preserve the expected code names, such as `PartyRunner`, `Config`, and `Combat`.
3. Update the party names and behavior settings in `Config.3.js`.
4. Update the boot configuration in `PartyBoot.1.js`.
5. Run `PartyBoot` manually on the configured leader.

The current configuration is written for my own Adventure Land characters and is not intended to be a plug-and-play bot for every account.

## Technical Focus

This project demonstrates practical work with:

* Modular JavaScript architecture
* Configuration-driven behavior
* Autonomous agents
* Role-based decision systems
* Shared state and party coordination
* Guard clauses and runtime validation
* Long-running interval loops
* Asynchronous action control
* Inventory classification
* Resource and supply logistics
* Incremental refactoring
* Debugging persistent game automation

## Current Development

The project is under active development.

Current areas of focus include:

* Improving merchant inventory classification
* Reducing inventory overflow
* Safely processing unknown and duplicate items
* Expanding automatic equipment decisions
* Improving upgrade and compound rules
* Strengthening recovery from interrupted town runs
* Integrating kill tracking with status reporting
* Continuing to separate large systems into smaller modules

## Why I Built This

Adventure Land provides a useful environment for practicing JavaScript because the scripts must continue making decisions over long periods of time.

Small mistakes can cause characters to become separated, attack the wrong target, run out of supplies, fill their inventories, or become trapped in repeated actions. Building this project has required me to think about state, priorities, failure recovery, communication between agents, and maintainable program structure rather than only writing isolated functions.

## Project Status

This is a personal portfolio and learning project. The scripts evolve alongside my characters, and some modules remain experimental or partially integrated.

The current system successfully demonstrates a modular foundation for coordinating a persistent automated party.
