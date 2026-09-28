/**
 * api/index.ts — the ONLY file in /api.
 *
 * Vercel turns every file under /api into its own serverless function, and the
 * Hobby plan allows 12. All backend code therefore lives in src/server/ and is
 * bundled into this single function. Do not add more files to /api.
 *
 * vercel.json rewrites every /api/* request to this function.
 */
import handler from "../src/server/handler.js";

export default handler;
