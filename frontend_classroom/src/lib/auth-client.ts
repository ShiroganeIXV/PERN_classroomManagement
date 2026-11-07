import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    // Keep auth cookies on the frontend domain through the Vite/Vercel proxy.
    baseURL: `${window.location.origin}/api/auth`,
    fetchOptions: { credentials: "include" },
    plugins: [inferAdditionalFields({
        user: {
            role: {
                type: "string",
                required: true,
                defaultValue: "student",
                input: true,
            },
            imageCldPubId: {
                type: "string",
                required: false,
                input: true,
            },
        },
    })],
});
