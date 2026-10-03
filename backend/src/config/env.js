import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

// Loads backend/.env for local runs, wherever the process was started from
// (the Vercel entry at api/index.js runs with the repo root as cwd, where
// the bare 'dotenv/config' import would look for the wrong .env — and
// couldn't even resolve 'dotenv', which is only installed in backend/).
//
// On Vercel there is no backend/.env (it's gitignored), so this is a no-op
// and the variables set in the Vercel dashboard are used. dotenv never
// overrides variables that are already set in the environment.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true })
