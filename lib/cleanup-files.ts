import { readdir, stat, unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/db/prisma";

/**
 * Limpa arquivos antigos do sistema de arquivos
 * Remove arquivos de áudio e avatares que não são mais referenciados ou são muito antigos
 */
export async function cleanupOldFiles() {
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos
  let deletedCount = 0;
  let errors = 0;

  try {
    // Limpar arquivos de áudio antigos
    const audioUploadDir = join(process.cwd(), "tmp", "uploads");
    await cleanupDirectory(audioUploadDir, maxAge, now);

    // Limpar avatares antigos (opcional - pode manter por mais tempo)
    const avatarUploadDir = join(process.cwd(), "tmp", "uploads", "avatars");
    await cleanupDirectory(avatarUploadDir, maxAge * 2, now); // 14 dias para avatares

    // Limpar registros órfãos no banco de dados
    await cleanupOrphanedRecords();

    console.log(`Cleanup completed. Deleted ${deletedCount} files.`);
    return { success: true, deletedCount, errors };
  } catch (error) {
    console.error("Error during cleanup:", error);
    return { success: false, deletedCount, errors: errors + 1 };
  }

  async function cleanupDirectory(dir: string, maxAge: number, now: number) {
    try {
      const files = await readdir(dir);
      
      for (const file of files) {
        const filePath = join(dir, file);
        
        try {
          const stats = await stat(filePath);
          
          // Se for diretório, pular (ou fazer recursão se necessário)
          if (stats.isDirectory()) {
            continue;
          }

          const fileAge = now - stats.mtimeMs;
          
          // Se o arquivo for mais antigo que maxAge, deletar
          if (fileAge > maxAge) {
            await unlink(filePath);
            deletedCount++;
            console.log(`Deleted old file: ${filePath}`);
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
          errors++;
        }
      }
    } catch (error) {
      // Se o diretório não existir, não é um erro crítico
      if ((error as any).code !== "ENOENT") {
        console.error(`Error reading directory ${dir}:`, error);
        errors++;
      }
    }
  }

  async function cleanupOrphanedRecords() {
    try {
      // Buscar todos os AudioFiles
      const audioFiles = await prisma.audioFile.findMany({
        select: { id: true, url: true },
      });

      // Verificar quais arquivos não existem mais no sistema de arquivos
      for (const audioFile of audioFiles) {
        try {
          const { existsSync } = await import("fs");
          if (!existsSync(audioFile.url)) {
            // Arquivo não existe mais, mas registro ainda está no banco
            // Podemos deletar o registro se não tiver transcrição importante
            // Por enquanto, apenas logamos
            console.log(`Orphaned record found: ${audioFile.id}`);
          }
        } catch (error) {
          // Ignorar erros individuais
        }
      }
    } catch (error) {
      console.error("Error cleaning orphaned records:", error);
      errors++;
    }
  }
}

