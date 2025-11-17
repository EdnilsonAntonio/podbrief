/**
 * Utilitários básicos de monitoramento e logging
 */

export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  CRITICAL = "critical",
}

interface LogContext {
  userId?: string;
  audioFileId?: string;
  transcriptionId?: string;
  error?: Error;
  [key: string]: any;
}

/**
 * Logger estruturado
 */
export function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  // Em produção, você pode enviar para um serviço de logging (Sentry, LogRocket, etc.)
  // Por enquanto, apenas console.log com formatação
  switch (level) {
    case LogLevel.ERROR:
    case LogLevel.CRITICAL:
      console.error(`[${level.toUpperCase()}] ${message}`, logEntry);
      break;
    case LogLevel.WARN:
      console.warn(`[${level.toUpperCase()}] ${message}`, logEntry);
      break;
    default:
      console.log(`[${level.toUpperCase()}] ${message}`, logEntry);
  }

  // Se for erro crítico, você pode adicionar notificação aqui
  if (level === LogLevel.CRITICAL) {
    // Exemplo: enviar para Sentry, email de alerta, etc.
    // sendCriticalAlert(logEntry);
  }
}

/**
 * Verificar e alertar sobre quota da OpenAI
 */
export async function checkOpenAIQuota() {
  // Esta função pode ser expandida para verificar a quota real da OpenAI
  // Por enquanto, apenas logamos quando há erro 429
  log(LogLevel.WARN, "OpenAI quota check - implement quota monitoring");
}

/**
 * Verificar espaço em disco
 */
export async function checkDiskSpace() {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    // Verificar espaço em disco (Unix/Mac)
    const { stdout } = await execAsync("df -h .");
    const lines = stdout.split("\n");
    
    // Extrair percentual de uso
    const usageLine = lines[1];
    if (usageLine) {
      const usage = usageLine.match(/(\d+)%/);
      if (usage) {
        const usagePercent = parseInt(usage[1]);
        
        if (usagePercent > 90) {
          log(LogLevel.CRITICAL, `Disk space critical: ${usagePercent}% used`, {
            usagePercent,
          });
        } else if (usagePercent > 80) {
          log(LogLevel.WARN, `Disk space warning: ${usagePercent}% used`, {
            usagePercent,
          });
        }
      }
    }
  } catch (error) {
    // Ignorar erros de verificação de disco (pode não funcionar em todos os ambientes)
    log(LogLevel.WARN, "Could not check disk space", { 
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
}

/**
 * Monitorar erros de transcrição
 */
export function logTranscriptionError(
  audioFileId: string,
  error: Error,
  context?: LogContext
) {
  log(LogLevel.ERROR, "Transcription failed", {
    audioFileId,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
}

/**
 * Monitorar erros de API
 */
export function logApiError(
  endpoint: string,
  error: Error,
  context?: LogContext
) {
  log(LogLevel.ERROR, `API error: ${endpoint}`, {
    endpoint,
    error: error instanceof Error ? error : new Error(String(error)),
    ...context,
  });
}

