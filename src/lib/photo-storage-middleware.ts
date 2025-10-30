// Middleware para automatizar upload de fotos e salvamento no PostgreSQL
import { uploadMultiplePhotos, UploadResult } from './r2-upload';
import { sendToN8NWebhook, N8NWebhookPayload } from './n8n-webhook';

// Interface para o resultado do upload múltiplo
interface MultipleUploadResult {
  success: boolean;
  results: UploadResult[];
  urls: string[];
  errors: string[];
}

// Interface para dados de entrada do middleware
export interface PhotoStorageInput {
  files: File[];
  session_id: string;
  user_data?: {
    nome?: string;
    email?: string;
    telefone?: string;
    cpf?: string;
  };
  metadata?: {
    criancas?: string[];
    mensagem?: string;
    order_bumps?: string[];
    prioridade?: number | null;
  };
}

// Interface para resultado do middleware
export interface PhotoStorageResult {
  success: boolean;
  uploaded_urls?: string[];
  postgres_saved?: boolean;
  errors?: string[];
  warnings?: string[];
}

// Configurações do middleware
export interface PhotoStorageConfig {
  max_files: number;
  auto_save_postgres: boolean;
  validate_urls: boolean;
  cleanup_on_error: boolean;
}

const defaultConfig: PhotoStorageConfig = {
  max_files: 3,
  auto_save_postgres: true,
  validate_urls: true,
  cleanup_on_error: false, // Por segurança, não deletamos automaticamente
};

/**
 * Valida URLs de fotos antes de salvar
 */
export function validatePhotoUrls(urls: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const url of urls) {
    // Verifica se é HTTPS
    if (!url.startsWith('https://')) {
      errors.push(`URL deve usar HTTPS: ${url}`);
    }
    
    // Verifica se é do domínio R2 correto
    if (!url.includes('.r2.cloudflarestorage.com') && !url.includes('.r2.dev')) {
      errors.push(`URL deve ser do Cloudflare R2: ${url}`);
    }
    
    // Verifica extensão de imagem
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = validExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );
    
    if (!hasValidExtension) {
      errors.push(`URL deve ter extensão de imagem válida: ${url}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitiza URLs removendo parâmetros desnecessários
 */
export function sanitizePhotoUrls(urls: string[]): string[] {
  return urls.map(url => {
    try {
      const urlObj = new URL(url);
      // Remove parâmetros de query desnecessários, mantém apenas os essenciais
      const allowedParams = ['v', 'version']; // Parâmetros permitidos
      
      const newSearchParams = new URLSearchParams();
      allowedParams.forEach(param => {
        const value = urlObj.searchParams.get(param);
        if (value) {
          newSearchParams.set(param, value);
        }
      });
      
      urlObj.search = newSearchParams.toString();
      return urlObj.toString();
    } catch {
      // Se não conseguir parsear, retorna a URL original
      return url;
    }
  });
}

/**
 * Middleware principal para upload e salvamento de fotos
 */
export async function processPhotoStorage(
  input: PhotoStorageInput,
  config: PhotoStorageConfig = defaultConfig
): Promise<PhotoStorageResult> {
  const result: PhotoStorageResult = {
    success: false,
    errors: [],
    warnings: []
  };

  try {
    // 1. Validações iniciais
    if (!input.session_id) {
      result.errors!.push('session_id é obrigatório');
      return result;
    }

    if (!input.files || input.files.length === 0) {
      result.errors!.push('Nenhum arquivo fornecido');
      return result;
    }

    if (input.files.length > config.max_files) {
      result.errors!.push(`Máximo de ${config.max_files} arquivos permitidos`);
      return result;
    }

    console.log(`[PHOTO-MIDDLEWARE] Processando ${input.files.length} fotos para session ${input.session_id}`);

    // 2. Upload para R2
    const uploadResult: MultipleUploadResult = await uploadMultiplePhotos(input.files, input.session_id);
   if (!uploadResult.success || !uploadResult.urls) {
      result.success = false;
      result.errors!.push(`Erro no upload: ${uploadResult.errors.join('; ') || 'Falha desconhecida'}`);
      return result;
    }

    result.uploaded_urls = uploadResult.urls;
    console.log(`[PHOTO-MIDDLEWARE] Upload concluído: ${uploadResult.urls.length} URLs geradas`);

    // 3. Validação das URLs (se habilitada)
    if (config.validate_urls) {
      const validation = validatePhotoUrls(uploadResult.urls);
      if (!validation.valid) {
        result.warnings!.push(...validation.errors);
        console.warn(`[PHOTO-MIDDLEWARE] Avisos de validação:`, validation.errors);
      }
    }

    // 4. Sanitização das URLs
    const sanitizedUrls = sanitizePhotoUrls(uploadResult.urls);
    result.uploaded_urls = sanitizedUrls;

    // 5. Salvamento no PostgreSQL (se habilitado)
    if (config.auto_save_postgres) {
      try {
        const n8nPayload: N8NWebhookPayload = {
          informacoes_contato: {
            nome: input.user_data?.nome || '',
            email: input.user_data?.email || '',
            telefone: input.user_data?.telefone || '',
            cpf: input.user_data?.cpf || '',
          },
          informacoes_pers: {
            criancas: input.metadata?.criancas || [],
            fotos: sanitizedUrls,
            mensagem: input.metadata?.mensagem || '',
            order_bumps_site: input.metadata?.order_bumps || [],
          },
          informacoes_utms: {
            session_id: input.session_id,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            locale: 'pt-BR',
            total_criancas: input.metadata?.criancas?.length || 0,
            incluir_fotos: true,
            prioridade: (input.metadata?.prioridade === 1) ? 1 : null,
          },
        };

        console.log(`[PHOTO-MIDDLEWARE] Salvando no PostgreSQL via N8N...`);
        const n8nResult = await sendToN8NWebhook(n8nPayload);
        
        if (n8nResult.success) {
          result.postgres_saved = true;
          console.log(`[PHOTO-MIDDLEWARE] Dados salvos no PostgreSQL com sucesso`);
        } else {
          result.postgres_saved = false;
          result.warnings!.push(`Erro ao salvar no PostgreSQL: ${n8nResult.error}`);
          console.error(`[PHOTO-MIDDLEWARE] Erro PostgreSQL:`, n8nResult.error);
        }
      } catch (postgresError) {
        result.postgres_saved = false;
        result.warnings!.push(`Erro interno ao salvar no PostgreSQL: ${postgresError}`);
        console.error(`[PHOTO-MIDDLEWARE] Erro interno PostgreSQL:`, postgresError);
      }
    }

    // 6. Resultado final
    result.success = true;
    console.log(`[PHOTO-MIDDLEWARE] Processo concluído com sucesso`);
    
    return result;

  } catch (error) {
    console.error(`[PHOTO-MIDDLEWARE] Erro geral:`, error);
    result.errors!.push(`Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return result;
  }
}

/**
 * Função utilitária para usar o middleware de forma simplificada
 */
export async function uploadAndSavePhotos(
  files: File[],
  session_id: string,
  user_data?: PhotoStorageInput['user_data']
): Promise<PhotoStorageResult> {
  return processPhotoStorage({
    files,
    session_id,
    user_data
  });
}

/**
 * Função para atualizar apenas as URLs de fotos no PostgreSQL
 */
export async function updatePhotosInDatabase(
  session_id: string,
  photo_urls: string[],
  user_data?: PhotoStorageInput['user_data']
): Promise<{ success: boolean; error?: string }> {
  try {
    // Valida URLs
    const validation = validatePhotoUrls(photo_urls);
    if (!validation.valid) {
      return {
        success: false,
        error: `URLs inválidas: ${validation.errors.join(', ')}`
      };
    }

    // Sanitiza URLs
    const sanitizedUrls = sanitizePhotoUrls(photo_urls);

    // Monta payload para N8N
    const n8nPayload: N8NWebhookPayload = {
      informacoes_contato: {
        nome: user_data?.nome || '',
        email: user_data?.email || '',
        telefone: user_data?.telefone || '',
        cpf: user_data?.cpf || '',
      },
      informacoes_pers: {
        criancas: [],
        fotos: sanitizedUrls,
        mensagem: '',
        order_bumps_site: [],
      },
      informacoes_utms: {
        session_id,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        locale: 'pt-BR',
        total_criancas: 0,
        incluir_fotos: true,
        prioridade: null,
      },
    };

    // Envia para N8N
    const result = await sendToN8NWebhook(n8nPayload);
    
    return {
      success: result.success,
      error: result.error
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}