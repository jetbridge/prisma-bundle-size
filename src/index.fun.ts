import { PrismaClient } from "@prisma/client";

export async function handler() {
  const client = new PrismaClient();
  console.log(await client.coolTable.findMany());
  console.log(1);
}
