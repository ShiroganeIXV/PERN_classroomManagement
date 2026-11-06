import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema/auth.js"; // your drizzle instance

export function resolveAuthBaseURL(environment: NodeJS.ProcessEnv = process.env): string {
    if (environment.BETTER_AUTH_URL) {
        return environment.BETTER_AUTH_URL;
    }

    const railwayDomain = environment.RAILWAY_PUBLIC_DOMAIN;
    if (railwayDomain) {
        return /^https?:\/\//i.test(railwayDomain) ? railwayDomain : `https://${railwayDomain}`;
    }

    if (environment.NODE_ENV === "production" || environment.RAILWAY_ENVIRONMENT || environment.RAILWAY_PROJECT_ID) {
        throw new Error("Set BETTER_AUTH_URL or expose RAILWAY_PUBLIC_DOMAIN for production authentication");
    }

    return `http://localhost:${environment.PORT || 8000}`;
}

export const auth = betterAuth({

    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: resolveAuthBaseURL(),
    trustedOrigins: [process.env.FRONTEND_URL!],


    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema
    }),

    emailAndPassword: {
        enabled: true,

    },

    // Custom fields added to the auth table
    user  :{
        additionalFields:{
            role:{
                type: 'string', required: true, defaultValue: 'student', input: true,
            },
            imageCldPubId:{
                type: 'string', required: false, input: true,
            }
        }
    }

});