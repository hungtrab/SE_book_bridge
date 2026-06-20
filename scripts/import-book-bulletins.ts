import { runDailyBulletinImport } from "../src/server/bulletins/service";
import { prisma } from "../src/server/lib/prisma";

runDailyBulletinImport()
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .finally(() => prisma.$disconnect());
