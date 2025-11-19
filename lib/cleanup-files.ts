import { readdir, stat, unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/db/prisma";
import { del } from "@vercel/blob";

/**
 * Limpa arquivos antigos do sistema de arquivos e banco de dados
 * Remove arquivos de áudio e avatares que não são mais referenciados ou são muito antigos
 * Deleta registros do banco de dados com mais de 7 dias
 * Deleta arquivos do Vercel Blob quando aplicável
 */
export async function cleanupOldFiles() {
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos
  const cutoffDate = new Date(now - maxAge);
  let deletedCount = 0;
  let deletedRecords = 0;
  let deletedBlobs = 0;
  let errors = 0;

  try {
    // 1. Limpar arquivos de áudio antigos do sistema de arquivos
    const audioUploadDir = process.env.VERCEL ? "/tmp/uploads" : join(process.cwd(), "tmp", "uploads");
    await cleanupDirectory(audioUploadDir, maxAge, now);

    // 2. Limpar avatares antigos (opcional - pode manter por mais tempo)
    const avatarUploadDir = process.env.VERCEL ? "/tmp/uploads/avatars" : join(process.cwd(), "tmp", "uploads", "avatars");
    await cleanupDirectory(avatarUploadDir, maxAge * 2, now); // 14 dias para avatares

    // 3. Limpar registros do banco de dados com mais de 7 dias
    const dbCleanupResult = await cleanupOldDatabaseRecords(cutoffDate);
    deletedRecords = dbCleanupResult.deletedRecords;
    deletedBlobs = dbCleanupResult.deletedBlobs;
    errors += dbCleanupResult.errors;

    console.log(`Cleanup completed. Deleted ${deletedCount} files, ${deletedRecords} database records, ${deletedBlobs} Blob files.`);
    return { 
      success: true, 
      deletedFiles: deletedCount,
      deletedRecords,
      deletedBlobs,
      errors 
    };
  } catch (error) {
    console.error("Error during cleanup:", error);
    return { 
      success: false, 
      deletedFiles: deletedCount,
      deletedRecords,
      deletedBlobs,
      errors: errors + 1 
    };
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

  async function cleanupOldDatabaseRecords(cutoffDate: Date) {
    let deletedRecords = 0;
    let deletedBlobs = 0;
    let recordErrors = 0;

    try {
      // Buscar todos os AudioFiles com mais de 7 dias
      const oldAudioFiles = await prisma.audioFile.findMany({
        where: {
          createdAt: {
            lt: cutoffDate, // Menor que (mais antigo que) a data de corte
          },
        },
        include: {
          transcription: {
            include: {
              summary: true,
            },
          },
        },
      });

      console.log(`Found ${oldAudioFiles.length} audio files older than 7 days`);

      for (const audioFile of oldAudioFiles) {
        try {
          // Deletar arquivo do Blob se for uma URL do Blob
          if (audioFile.url.startsWith("https://")) {
            try {
              await del(audioFile.url, {
                token: process.env.BLOB_READ_WRITE_TOKEN,
              });
              deletedBlobs++;
              console.log(`✅ Deleted Blob file: ${audioFile.url}`);
            } catch (blobError: any) {
              console.warn(`⚠️ Failed to delete Blob file ${audioFile.url}:`, blobError.message);
              // Continuar mesmo se falhar ao deletar do Blob
            }
          } else {
            // Tentar deletar arquivo local se existir
            try {
              const { existsSync } = await import("fs");
              if (existsSync(audioFile.url)) {
                await unlink(audioFile.url);
                deletedCount++;
                console.log(`✅ Deleted local file: ${audioFile.url}`);
              }
            } catch (fileError) {
              // Ignorar se arquivo já não existir
            }
          }

          // Deletar Summary primeiro (se existir)
          if (audioFile.transcription?.summary) {
            await prisma.summary.delete({
              where: { id: audioFile.transcription.summary.id },
            });
            console.log(`✅ Deleted summary for transcription ${audioFile.transcription.id}`);
          }

          // Deletar Transcription (se existir)
          if (audioFile.transcription) {
            await prisma.transcription.delete({
              where: { id: audioFile.transcription.id },
            });
            console.log(`✅ Deleted transcription ${audioFile.transcription.id}`);
          }

          // Deletar AudioFile
          await prisma.audioFile.delete({
            where: { id: audioFile.id },
          });
          deletedRecords++;
          console.log(`✅ Deleted audio file record: ${audioFile.id}`);
        } catch (recordError: any) {
          console.error(`❌ Error deleting record ${audioFile.id}:`, recordError.message);
          recordErrors++;
        }
      }

      return { deletedRecords, deletedBlobs, errors: recordErrors };
    } catch (error) {
      console.error("Error cleaning old database records:", error);
      return { deletedRecords, deletedBlobs, errors: recordErrors + 1 };
    }
  }
}

