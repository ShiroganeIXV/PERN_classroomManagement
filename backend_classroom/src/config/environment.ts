import "dotenv/config";

const developmentModes = new Set(["development", "test"]);

export function normalizeRuntimeEnvironment(environment: NodeJS.ProcessEnv = process.env): void {
    if (!environment.RAILWAY_PROJECT_ID && !environment.RAILWAY_ENVIRONMENT) {
        return;
    }

    for (const key of ["NODE_ENV", "ARCJET_ENV", "MODE"] as const) {
        const mode = environment[key];
        if (mode && developmentModes.has(mode.toLowerCase())) {
            environment[key] = "production";
        }
    }
}

normalizeRuntimeEnvironment();