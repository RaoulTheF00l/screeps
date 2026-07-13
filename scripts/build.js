const fs = require("node:fs");
const path = require("node:path");

const SOURCE_DIRECTORY = path.resolve("src");
const OUTPUT_DIRECTORY = path.resolve("dist");

function findFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true })
        .flatMap(entry => {
            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                return findFiles(fullPath);
            }

            return [fullPath];
        });
}

function build() {
    fs.rmSync(OUTPUT_DIRECTORY, {
        recursive: true,
        force: true
    });

    fs.mkdirSync(OUTPUT_DIRECTORY, {
        recursive: true
    });

    const sourceFiles = findFiles(SOURCE_DIRECTORY)
        .filter(filePath => filePath.endsWith(".js"));

    for (const sourcePath of sourceFiles) {
        const relativePath = path.relative(
            SOURCE_DIRECTORY,
            sourcePath
        );

        // colony/population.js becomes colony.population.js
        const outputFilename = relativePath
            .split(path.sep)
            .join(".");

        const outputPath = path.join(
            OUTPUT_DIRECTORY,
            outputFilename
        );

        fs.copyFileSync(sourcePath, outputPath);

        console.log(
            `${relativePath} -> ${outputFilename}`
        );
    }

    console.log(
        `Built ${sourceFiles.length} Screeps modules.`
    );
}

build();