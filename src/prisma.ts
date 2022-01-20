import { PrismaClient } from "@prisma/client";

export async function handler() {
  const client = new PrismaClient();
  console.log(await client.cool.findMany());
  console.log("ok");
}
