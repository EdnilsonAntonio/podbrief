"use server";

import { prisma } from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Função para cuidar da autenticação
export async function checkAuthStatus() {
  // Verifica se o usuário está autenticado pelo Kinde
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.email) return { success: false };

  // Procura o usuário autenticado na BD usando email (que é único)
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  // Se não existir na DB, então crie o usuário (Sign Up)
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: user.email,
        name:
          [user.given_name, user.family_name].filter(Boolean).join(" ") || null,
        imageUrl: user.picture || null,
      },
    });
  }

  return { success: true };
}
