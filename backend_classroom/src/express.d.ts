import {user} from "./db/schema";

declare global {
    namespace Express {
        interface Request {
            user?: {
                role?: "admin" | "teacher" | "student"}
        }

    }
}

export {};