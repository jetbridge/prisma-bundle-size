import { PrismaClient } from "@prisma/client";

export async function handler() {
  const client = new PrismaClient();
  console.log(await client.certification.findMany());
  console.log(1);
}
