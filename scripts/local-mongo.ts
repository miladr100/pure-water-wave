import { MongoMemoryServer } from "mongodb-memory-server";

// A throwaway MongoDB for local development and browser testing when no
// Atlas cluster is at hand. Data lives until the process is stopped.
async function main() {
  const server = await MongoMemoryServer.create({
    instance: { port: Number(process.env.LOCAL_MONGO_PORT) || 27117, dbName: "pww-academy" },
  });

  const uri = server.getUri("pww-academy");
  console.log(`MongoDB em memória pronto.\nMONGODB_URI=${uri}`);

  const stop = async () => {
    await server.stop();
    process.exit(0);
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => {}, 1 << 30);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
