import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/db/prisma";

export async function getAuthenticatedUser() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser || !kindeUser.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: kindeUser.email },
  });

  return user;
}

