// Sistema de backup e cleanup de fotos órfãs no Cloudflare R2
import { S3Client, ListObjectsV2Command, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';

// Configuração do cliente R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

// Configurações do cleanup
export interface CleanupConfig {
  bucket_name: string;
  backup_bucket_name?: string;
  max_age_days: number;
  batch_size: number;
  dry_run: boolean;
}

const defaultCleanupConfig: CleanupConfig = {
  bucket_name: process.env.R2_BUCKET_NAME || 'recadinhos-fotos',
  backup_bucket_name: process.env.R2_BACKUP_BUCKET_NAME,
  max_age_days: 30, // Fotos órfãs com mais de 30 dias
  batch_size: 100,
  dry_run: true, // Por segurança, sempre começar em modo dry-run
};

// Interface para resultado do cleanup
export interface CleanupResult {
  success: boolean;
  processed_files: number;
  orphaned_files: number;
  backed_up_files: number;
  deleted_files: number;
  errors: string[];
  warnings: string[];
  dry_run: boolean;
}

// Interface para arquivo no R2
interface R2File {
  key: string;
  size: number;
  lastModified: Date;
  session_id?: string;
}

/**
 * Lista todos os arquivos no bucket R2
 */
async function listR2Files(bucketName: string, prefix?: string): Promise<R2File[]> {
  const files: R2File[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await r2Client.send(command);
      
      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.Size && object.LastModified) {
            // Extrai session_id do caminho do arquivo
            const sessionMatch = object.Key.match(/photos\/([^\/]+)\//);
            
            files.push({
              key: object.Key,
              size: object.Size,
              lastModified: object.LastModified,
              session_id: sessionMatch ? sessionMatch[1] : undefined,
            });
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return files;
  } catch (error) {
    console.error('[CLEANUP] Erro ao listar arquivos R2:', error);
    throw error;
  }
}

/**
 * Verifica se uma sessão existe no PostgreSQL
 * TODO: Implementar consulta real ao banco
 */
async function sessionExistsInDatabase(session_id: string): Promise<boolean> {
  try {
    // OPÇÃO 1: Consulta via N8N webhook
    const n8nQueryUrl = process.env.N8N_QUERY_WEBHOOK_URL;
    
    if (n8nQueryUrl) {
      const response = await fetch(n8nQueryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.N8N_WEBHOOK_JWT_SECRET || ''}`
        },
        body: JSON.stringify({
          action: 'check_session_exists',
          session_id: session_id
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.exists === true;
      }
    }

    // OPÇÃO 2: Consulta direta ao PostgreSQL (se configurado)
    // TODO: Implementar conexão direta

    // Por enquanto, assume que todas as sessões existem (modo seguro)
    console.warn(`[CLEANUP] Não foi possível verificar sessão ${session_id} - assumindo que existe`);
    return true;

  } catch (error) {
    console.error(`[CLEANUP] Erro ao verificar sessão ${session_id}:`, error);
    // Em caso de erro, assume que existe (modo seguro)
    return true;
  }
}

/**
 * Faz backup de um arquivo para o bucket de backup
 */
async function backupFile(
  sourceKey: string,
  sourceBucket: string,
  backupBucket: string
): Promise<boolean> {
  try {
    const backupKey = `backup/${new Date().toISOString().split('T')[0]}/${sourceKey}`;
    
    const command = new CopyObjectCommand({
      CopySource: `${sourceBucket}/${sourceKey}`,
      Bucket: backupBucket,
      Key: backupKey,
    });

    await r2Client.send(command);
    console.log(`[CLEANUP] Backup criado: ${backupKey}`);
    return true;

  } catch (error) {
    console.error(`[CLEANUP] Erro ao fazer backup de ${sourceKey}:`, error);
    return false;
  }
}

/**
 * Deleta um arquivo do R2
 */
async function deleteFile(key: string, bucketName: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`[CLEANUP] Arquivo deletado: ${key}`);
    return true;

  } catch (error) {
    console.error(`[CLEANUP] Erro ao deletar ${key}:`, error);
    return false;
  }
}

/**
 * Identifica arquivos órfãos no R2
 */
async function findOrphanedFiles(
  files: R2File[],
  maxAgeDays: number
): Promise<R2File[]> {
  const orphanedFiles: R2File[] = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

  console.log(`[CLEANUP] Verificando ${files.length} arquivos para órfãos mais antigos que ${cutoffDate.toISOString()}`);

  for (const file of files) {
    // Verifica idade do arquivo
    if (file.lastModified > cutoffDate) {
      continue; // Arquivo muito recente
    }

    // Verifica se tem session_id
    if (!file.session_id) {
      console.warn(`[CLEANUP] Arquivo sem session_id: ${file.key}`);
      orphanedFiles.push(file);
      continue;
    }

    // Verifica se a sessão existe no banco
    const sessionExists = await sessionExistsInDatabase(file.session_id);
    if (!sessionExists) {
      console.log(`[CLEANUP] Sessão órfã encontrada: ${file.session_id} (arquivo: ${file.key})`);
      orphanedFiles.push(file);
    }
  }

  return orphanedFiles;
}

/**
 * Executa o processo de cleanup de fotos órfãs
 */
export async function cleanupOrphanedPhotos(
  config: Partial<CleanupConfig> = {}
): Promise<CleanupResult> {
  const finalConfig = { ...defaultCleanupConfig, ...config };
  
  const result: CleanupResult = {
    success: false,
    processed_files: 0,
    orphaned_files: 0,
    backed_up_files: 0,
    deleted_files: 0,
    errors: [],
    warnings: [],
    dry_run: finalConfig.dry_run,
  };

  try {
    console.log(`[CLEANUP] Iniciando cleanup ${finalConfig.dry_run ? '(DRY RUN)' : '(REAL)'}`);
    console.log(`[CLEANUP] Configuração:`, finalConfig);

    // 1. Lista todos os arquivos de fotos
    const allFiles = await listR2Files(finalConfig.bucket_name, 'photos/');
    result.processed_files = allFiles.length;
    
    console.log(`[CLEANUP] Encontrados ${allFiles.length} arquivos de fotos`);

    if (allFiles.length === 0) {
      result.success = true;
      result.warnings.push('Nenhum arquivo encontrado para processar');
      return result;
    }

    // 2. Identifica arquivos órfãos
    const orphanedFiles = await findOrphanedFiles(allFiles, finalConfig.max_age_days);
    result.orphaned_files = orphanedFiles.length;

    console.log(`[CLEANUP] Encontrados ${orphanedFiles.length} arquivos órfãos`);

    if (orphanedFiles.length === 0) {
      result.success = true;
      result.warnings.push('Nenhum arquivo órfão encontrado');
      return result;
    }

    // 3. Processa arquivos órfãos em lotes
    for (let i = 0; i < orphanedFiles.length; i += finalConfig.batch_size) {
      const batch = orphanedFiles.slice(i, i + finalConfig.batch_size);
      
      console.log(`[CLEANUP] Processando lote ${Math.floor(i / finalConfig.batch_size) + 1}/${Math.ceil(orphanedFiles.length / finalConfig.batch_size)}`);

      for (const file of batch) {
        try {
          // Backup (se configurado e não for dry-run)
          if (finalConfig.backup_bucket_name && !finalConfig.dry_run) {
            const backupSuccess = await backupFile(
              file.key,
              finalConfig.bucket_name,
              finalConfig.backup_bucket_name
            );
            
            if (backupSuccess) {
              result.backed_up_files++;
            } else {
              result.warnings.push(`Falha no backup de ${file.key}`);
              continue; // Não deleta se backup falhou
            }
          }

          // Deleção (se não for dry-run)
          if (!finalConfig.dry_run) {
            const deleteSuccess = await deleteFile(file.key, finalConfig.bucket_name);
            
            if (deleteSuccess) {
              result.deleted_files++;
            } else {
              result.errors.push(`Falha ao deletar ${file.key}`);
            }
          } else {
            console.log(`[CLEANUP] [DRY RUN] Seria deletado: ${file.key}`);
            result.deleted_files++; // Conta como "seria deletado"
          }

        } catch (error) {
          const errorMsg = `Erro ao processar ${file.key}: ${error}`;
          result.errors.push(errorMsg);
          console.error(`[CLEANUP] ${errorMsg}`);
        }
      }
    }

    result.success = result.errors.length === 0;
    
    console.log(`[CLEANUP] Processo concluído:`);
    console.log(`  - Arquivos processados: ${result.processed_files}`);
    console.log(`  - Arquivos órfãos: ${result.orphaned_files}`);
    console.log(`  - Backups criados: ${result.backed_up_files}`);
    console.log(`  - Arquivos deletados: ${result.deleted_files}`);
    console.log(`  - Erros: ${result.errors.length}`);
    console.log(`  - Avisos: ${result.warnings.length}`);

    return result;

  } catch (error) {
    const errorMsg = `Erro geral no cleanup: ${error}`;
    result.errors.push(errorMsg);
    console.error(`[CLEANUP] ${errorMsg}`);
    return result;
  }
}

/**
 * Função utilitária para executar cleanup em modo seguro (dry-run)
 */
export async function previewCleanup(maxAgeDays: number = 30): Promise<CleanupResult> {
  return cleanupOrphanedPhotos({
    max_age_days: maxAgeDays,
    dry_run: true,
  });
}

/**
 * Função utilitária para executar cleanup real (com backup)
 */
export async function executeCleanup(
  maxAgeDays: number = 30,
  createBackup: boolean = true
): Promise<CleanupResult> {
  const config: Partial<CleanupConfig> = {
    max_age_days: maxAgeDays,
    dry_run: false,
  };

  // Remove backup se não solicitado
  if (!createBackup) {
    config.backup_bucket_name = undefined;
  }

  return cleanupOrphanedPhotos(config);
}

/**
 * Função para agendar cleanup automático
 * TODO: Integrar com sistema de cron jobs ou similar
 */
export function scheduleCleanup(intervalHours: number = 24): void {
  console.log(`[CLEANUP] Agendando cleanup automático a cada ${intervalHours} horas`);
  
  setInterval(async () => {
    try {
      console.log('[CLEANUP] Executando cleanup automático...');
      const result = await previewCleanup();
      
      if (result.orphaned_files > 0) {
        console.log(`[CLEANUP] Encontrados ${result.orphaned_files} arquivos órfãos - considere executar cleanup real`);
      }
    } catch (error) {
      console.error('[CLEANUP] Erro no cleanup automático:', error);
    }
  }, intervalHours * 60 * 60 * 1000);
}