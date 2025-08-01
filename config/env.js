import { config } from "dotenv";

config({path: ".env"});

export const {
    PORT, NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN
} = process.env;