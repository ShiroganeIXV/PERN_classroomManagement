import type { BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";

export const authOptions = {
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const role = ctx.body?.role ?? "student";
        if (role !== "student" && role !== "teacher") {
          throw new APIError("BAD_REQUEST", {
            message: "Please choose Student or Teacher.",
          });
        }
        if (typeof ctx.body?.name !== "string" || !ctx.body.name.trim()) {
          throw new APIError("BAD_REQUEST", { message: "Name is required." });
        }
        return { context: { body: { ...ctx.body, name: ctx.body.name.trim(), role } } };
      }
      if (ctx.path === "/update-user" && ctx.body?.role !== undefined) {
        throw new APIError("BAD_REQUEST", {
          message: "Role cannot be changed through profile updates.",
        });
      }
    }),
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: true, // Allow role to be set during registration
      },
      imageCldPubId: {
        type: "string",
        required: false,
        input: true, // Allow imageCldPubId to be set during registration
      },
    },
  },
} satisfies BetterAuthOptions;
