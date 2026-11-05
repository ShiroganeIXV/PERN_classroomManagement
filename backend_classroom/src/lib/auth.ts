import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import {user} from "../db/schema";
import * as schema from "../db/schema/auth"; // your drizzle instance

export const auth = betterAuth({

    secret: process.env.BETTER_AUTH_SECRET!,
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