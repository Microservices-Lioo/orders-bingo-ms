import 'dotenv/config';
import * as env from 'env-var';

interface EnvVars {
    PORT: number,
    DATABASE_URL: string,
    POSTGRES_USER: string,
    POSTGRES_PASSWORD: string,
    POSTGRES_DB: string,
}

export const envs: EnvVars = {
    PORT: env.get('PORT').required().asPortNumber(),
    DATABASE_URL: env.get('DATABASE_URL').required().asString(),
    POSTGRES_USER: env.get('POSTGRES_USER').required().asString(),
    POSTGRES_PASSWORD: env.get('POSTGRES_PASSWORD').required().asString(),
    POSTGRES_DB: env.get('POSTGRES_DB').required().asString(),
}
