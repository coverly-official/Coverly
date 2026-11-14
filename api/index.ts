if (!process.env.INSFORGE_BASE_URL) {
  process.env.INSFORGE_BASE_URL = "https://4vwfw2w8.ap-southeast.insforge.app";
}
if (!process.env.INSFORGE_ANON_KEY) {
  process.env.INSFORGE_ANON_KEY = "anon_9da4660d2d03cec83d7ea57032348bab48a951f8ddf8b2b9dccdfb4b77eefe58";
}
if (!process.env.INSFORGE_API_KEY) {
  process.env.INSFORGE_API_KEY = "ik_1d1fb7f3feb4e7723e653ef844b24492486caa96de0940f2e658c2f30cd392a1";
}

import app from "../backend/src/app.js";

export default app;
