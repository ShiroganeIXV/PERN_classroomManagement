import type { CorsOptions } from "cors";

export function normalizeFrontendOrigin(origin: string | undefined): string | undefined {
  const normalizedOrigin = origin?.trim().replace(/\/+$/, "");
  return normalizedOrigin || undefined;
}

export function createCorsOptions(origin: string | undefined): CorsOptions {
  return {
    origin: (requestOrigin, callback) => {
      callback(null, origin && requestOrigin === origin ? origin : false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  };
}

export const frontendOrigin = normalizeFrontendOrigin(process.env.FRONTEND_URL);
export const frontendCorsOptions = createCorsOptions(frontendOrigin);