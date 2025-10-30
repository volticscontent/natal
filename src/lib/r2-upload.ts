import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Configuração do Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

export interface UploadConfig {
  maxFileSize: number; // em bytes
  allowedFormats: string[];
  bucket: string;
}

const defaultConfig: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['jpeg', 'jpg', 'png', 'webp'],
  bucket: process.env.R2_BUCKET_NAME || 'recadinhos-fotos',
};

/**
 * Valida se o arquivo está dentro dos parâmetros permitidos
 */
function validateFile(file: File, config: UploadConfig): { valid: boolean; error?: string } {
  // Verifica tamanho
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo permitido: ${config.maxFileSize / 1024 / 1024}MB`,
    };
  }

  // Verifica formato
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !config.allowedFormats.includes(fileExtension)) {
    return {
      valid: false,
      error: `Formato não permitido. Formatos aceitos: ${config.allowedFormats.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Gera nome único para o arquivo
 */
function generateFileName(originalName: string, sessionId: string): string {
  console.log(`[R2-UPLOAD] Gerando nome para arquivo: ${originalName}`);
  console.log(`[R2-UPLOAD] Session ID: ${sessionId}`);
  
  // Sanitizar o nome original
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  console.log(`[R2-UPLOAD] Nome sanitizado: ${sanitizedName}`);
  
  const extension = sanitizedName.split('.').pop() || 'jpg';
  console.log(`[R2-UPLOAD] Extensão extraída: ${extension}`);
  
  const timestamp = Date.now();
  const uniqueId = uuidv4().substring(0, 8);
  
  const finalName = `${sessionId}_${timestamp}_${uniqueId}.${extension}`;
  console.log(`[R2-UPLOAD] Nome final gerado: ${finalName}`);
  
  return finalName;
}

/**
 * Faz upload de uma foto para o Cloudflare R2
 */
export async function uploadPhotoToR2(
  file: File,
  sessionId: string,
  config: UploadConfig = defaultConfig
): Promise<UploadResult> {
  try {
    // Valida o arquivo
    const validation = validateFile(file, config);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Gera nome único
    const fileName = generateFileName(file.name, sessionId);

    // Converte File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Comando de upload
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: `fotos/${fileName}`,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'original-name': file.name,
        'session-id': sessionId,
        'upload-timestamp': Date.now().toString(),
      },
    });

    // Executa upload
    await r2Client.send(command);

    // Gera URL pública
    const publicUrl = `${process.env.R2_PUBLIC_URL}/fotos/${fileName}`;

    return {
      success: true,
      url: publicUrl,
      fileName,
    };
  } catch (error) {
    console.error('Erro no upload para R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no upload',
    };
  }
}

/**
 * Faz upload de múltiplas fotos (máximo 3)
 */
export async function uploadMultiplePhotos(
  files: File[],
  sessionId: string,
  config: UploadConfig = defaultConfig
): Promise<{
  success: boolean;
  results: UploadResult[];
  urls: string[];
  errors: string[];
}> {
  // Limita a 3 fotos
  const limitedFiles = files.slice(0, 3);
  
  const results: UploadResult[] = [];
  const urls: string[] = [];
  const errors: string[] = [];

  // Upload paralelo de todas as fotos
  const uploadPromises = limitedFiles.map(file => 
    uploadPhotoToR2(file, sessionId, config)
  );

  const uploadResults = await Promise.all(uploadPromises);

  uploadResults.forEach((result, index) => {
    results.push(result);
    
    if (result.success && result.url) {
      urls.push(result.url);
    } else if (result.error) {
      errors.push(`Foto ${index + 1}: ${result.error}`);
    }
  });

  return {
    success: errors.length === 0,
    results,
    urls,
    errors,
  };
}

/**
 * Gera URL pré-assinada para upload direto do frontend (opcional)
 */
export async function generatePresignedUrl(
  fileName: string,
  sessionId: string,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    
    const uniqueFileName = generateFileName(fileName, sessionId);
    
    const command = new PutObjectCommand({
      Bucket: defaultConfig.bucket,
      Key: `fotos/${uniqueFileName}`,
      ContentType: contentType,
      Metadata: {
        'session-id': sessionId,
        'original-name': fileName,
      },
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1 hora

    return {
      success: true,
      url: signedUrl,
    };
  } catch (error) {
    console.error('Erro ao gerar URL pré-assinada:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar URL',
    };
  }
}