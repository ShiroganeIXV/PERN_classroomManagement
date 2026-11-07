import { betterAuth } from "better-auth";
import { authOptions } from "./auth-options.js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db/index.js"; // your drizzle instance
import * as schema from "../db/schema/auth.js";
import { frontendOrigin } from "./frontend-origin.js";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: frontendOrigin ? [frontendOrigin] : [],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  ...authOptions,
});
