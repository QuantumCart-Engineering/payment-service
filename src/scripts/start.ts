import { spawn } from "node:child_process";

const runCommand = (
    command: string,
    args: string[]
): Promise<void> => {
    return new Promise(
        (resolve, reject) => {
            const child = spawn(
                command,
                args,
                {
                    stdio: "inherit",
                    shell: false
                }
            );

            child.on(
                "error",
                reject
            );

            child.on(
                "exit",
                (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(
                            new Error(
                                `Command failed with exit code ${code}`
                            )
                        );
                    }
                }
            );
        }
    );
};

const start = async (): Promise<void> => {
    try {
        console.log(
            "Running Payment Service database migrations..."
        );

        await runCommand(
            "node",
            ["dist/scripts/migrate.js"]
        );

        console.log(
            "Payment Service database migrations completed."
        );

        console.log(
            "Starting Payment Service..."
        );

        await runCommand(
            "node",
            ["dist/server.js"]
        );
    } catch (error) {
        console.error(
            "Payment Service startup failed:",
            error
        );

        process.exit(1);
    }
};

start();