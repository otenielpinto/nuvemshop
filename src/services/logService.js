import { TMongo } from "../infra/mongoClient.js";
const DAYS_LOG = 3;

async function init() {
  await autoClearLog();
}

async function saveLog(payload) {
  let body = {
    ...payload,
    created_at: new Date().toISOString(),
  };
  const client = await TMongo.connect();
  return await client.collection("tmp_log").insertOne(body);
}

async function clearLog() {
  const client = await TMongo.connect();
  return await client.collection("tmp_log").deleteMany({});
}

async function autoClearLog() {
  const client = await TMongo.connect();
  return await client.collection("tmp_log").deleteMany({
    created_at: { $lt: new Date().setDate(new Date().getDate() - DAYS_LOG) },
  });
}

const logService = {
  init,
  saveLog,
  clearLog,
  autoClearLog,
};

export { logService };
