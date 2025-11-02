// Cliente para API do Google Tag Manager
// Permite configuração automática de tags, triggers e variáveis

import { google } from 'googleapis';
import { GTMTagConfig, GTMTriggerConfig, GTM_TRIGGERS, FACEBOOK_TAGS, TIKTOK_TAGS, GA4_TAGS, getGTMVariables } from './gtm-config';

export interface GTMApiConfig {
  accountId: string;
  containerId: string;
  workspaceId?: string;
  serviceAccountKey?: string;
  accessToken?: string;
}

export interface GTMApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  resourceId?: string;
}

export class GTMApiClient {
  private tagmanager: any;
  private config: GTMApiConfig;
  private auth: any;

  constructor(config: GTMApiConfig) {
    this.config = config;
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      if (this.config.serviceAccountKey) {
        // Autenticação via Service Account
        this.auth = new google.auth.GoogleAuth({
          keyFile: this.config.serviceAccountKey,
          scopes: ['https://www.googleapis.com/auth/tagmanager.edit.containers']
        });
      } else if (this.config.accessToken) {
        // Autenticação via Access Token
        this.auth = new google.auth.OAuth2();
        this.auth.setCredentials({ access_token: this.config.accessToken });
      } else {
        throw new Error('Configuração de autenticação inválida');
      }

      this.tagmanager = google.tagmanager({ version: 'v2', auth: this.auth });
    } catch (error) {
      console.error('Erro ao inicializar autenticação GTM:', error);
      throw error;
    }
  }

  // Listar workspaces existentes
  async listWorkspaces(): Promise<GTMApiResponse> {
    try {
      const response = await this.tagmanager.accounts.containers.workspaces.list({
        parent: `accounts/${this.config.accountId}/containers/${this.config.containerId}`
      });

      return {
        success: true,
        data: response.data.workspace || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar triggers existentes
  async listTriggers(workspaceId: string): Promise<GTMApiResponse> {
    try {
      const response = await this.tagmanager.accounts.containers.workspaces.triggers.list({
        parent: `accounts/${this.config.accountId}/containers/${this.config.containerId}/workspaces/${workspaceId}`
      });
      
      return {
        success: true,
        data: response.data.trigger || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar workspace para as mudanças
  async createWorkspace(name: string, description?: string): Promise<GTMApiResponse> {
    try {
      const response = await this.tagmanager.accounts.containers.workspaces.create({
        parent: `accounts/${this.config.accountId}/containers/${this.config.containerId}`,
        requestBody: {
          name,
          description: description || 'Workspace criado automaticamente para configuração de tags'
        }
      });

      return {
        success: true,
        data: response.data,
        resourceId: response.data.workspaceId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar variável no GTM
  async createVariable(variable: any, workspaceId?: string): Promise<GTMApiResponse> {
    try {
      const workspace = workspaceId || this.config.workspaceId || '1';
      const response = await this.tagmanager.accounts.containers.workspaces.variables.create({
        parent: `accounts/${this.config.accountId}/containers/${this.config.containerId}/workspaces/${workspace}`,
        requestBody: {
          name: variable.variableName,
          type: variable.variableType,
          parameter: this.buildVariableParameters(variable)
        }
      });

      return {
        success: true,
        data: response.data,
        resourceId: response.data.variableId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar trigger no GTM
  async createTrigger(trigger: GTMTriggerConfig, workspaceId?: string): Promise<GTMApiResponse> {
    try {
      const workspace = workspaceId || this.config.workspaceId || '1';
      const response = await this.tagmanager.accounts.containers.workspaces.triggers.create({
        parent: `accounts/${this.config.accountId}/containers/${this.config.containerId}/workspaces/${workspace}`,
        requestBody: {
          name: trigger.triggerName,
          type: trigger.triggerType,
          customEventFilter: trigger.triggerType === 'customEvent' ? [
            {
              type: 'equals',
              parameter: [
                { type: 'template', key: 'arg0', value: '{{_event}}' },
                { type: 'template', key: 'arg1', value: trigger.conditions.eventName }
              ]
            }
          ] : undefined
        }
      });

      return {
        success: true,
        data: response.data,
        resourceId: response.data.triggerId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar tag no GTM
  async createTag(tag: GTMTagConfig, triggerIds: string[], workspaceId?: string): Promise<GTMApiResponse> {
    try {
      const workspace = workspaceId || this.config.workspaceId || '1';
      const response = await this.tagmanager.accounts.containers.workspaces.tags.create({
        parent: `accounts/${this.config.accountId}/containers/${this.config.containerId}/workspaces/${workspace}`,
        requestBody: {
          name: tag.tagName,
          type: this.mapTagType(tag.tagType),
          parameter: this.buildTagParameters(tag),
          firingTriggerId: triggerIds,
          tagFiringOption: 'oncePerEvent'
        }
      });

      return {
        success: true,
        data: response.data,
        resourceId: response.data.tagId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar variáveis existentes no workspace
  async listVariables(workspaceId: string): Promise<GTMApiResponse> {
    try {
      const workspace = workspaceId || this.config.workspaceId || '1';
      const response = await this.tagmanager.accounts.containers.workspaces.variables.list({
        parent: `accounts/${this.config.accountId}/containers/${this.config.containerId}/workspaces/${workspace}`
      });

      return {
        success: true,
        data: response.data.variable || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Listar tags existentes no workspace
  async listTags(workspaceId: string): Promise<GTMApiResponse> {
    try {
      const workspace = workspaceId || this.config.workspaceId || '1';
      const response = await this.tagmanager.accounts.containers.workspaces.tags.list({
        parent: `accounts/${this.config.accountId}/containers/${this.config.containerId}/workspaces/${workspace}`
      });

      return {
        success: true,
        data: response.data.tag || []
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Configurar todas as tags automaticamente
  async setupAllTags(workspaceId?: string): Promise<{
    success: boolean;
    results: {
      variables: GTMApiResponse[];
      triggers: GTMApiResponse[];
      tags: GTMApiResponse[];
    };
    errors: string[];
  }> {
    const results = {
      variables: [] as GTMApiResponse[],
      triggers: [] as GTMApiResponse[],
      tags: [] as GTMApiResponse[]
    };
    const errors: string[] = [];

    try {
      // 1. Criar variáveis
      console.log('Criando variáveis...');
      
      // Primeiro, listar variáveis existentes
      const existingVariablesResult = await this.listVariables(workspaceId || '');
      const existingVariables = existingVariablesResult.success ? existingVariablesResult.data : [];
      
      for (const variable of getGTMVariables()) {
        // Verificar se a variável já existe
        const existingVariable = existingVariables.find((v: any) => v.name === variable.variableName);
        
        if (existingVariable) {
          // Usar variável existente
          console.log(`✅ Variável já existe: ${variable.variableName} (ID: ${existingVariable.variableId})`);
          results.variables.push({
            success: true
            // Não incluir resourceId para entidades existentes
          });
        } else {
          // Criar nova variável
          const result = await this.createVariable(variable, workspaceId);
          results.variables.push(result);
          if (!result.success) {
            errors.push(`Erro ao criar variável ${variable.variableName}: ${result.error}`);
          }
        }
      }

      // 2. Criar triggers
      console.log('Criando triggers...');
      const triggerMap: Record<string, string> = {};
      
      // Primeiro, listar triggers existentes
      const existingTriggersResult = await this.listTriggers(workspaceId || '');
      const existingTriggers = existingTriggersResult.success ? existingTriggersResult.data : [];
      
      for (const trigger of GTM_TRIGGERS) {
        // Verificar se o trigger já existe
        const existingTrigger = existingTriggers.find((t: any) => t.name === trigger.triggerName);
        
        if (existingTrigger) {
          // Usar trigger existente
          triggerMap[trigger.triggerId] = existingTrigger.triggerId;
          console.log(`✅ Trigger já existe: ${trigger.triggerName} (ID: ${existingTrigger.triggerId})`);
          results.triggers.push({
            success: true
            // Não incluir resourceId para entidades existentes
          });
        } else {
          // Criar novo trigger
          const result = await this.createTrigger(trigger, workspaceId);
          results.triggers.push(result);
          if (result.success && result.resourceId) {
            triggerMap[trigger.triggerId] = result.resourceId;
          } else {
            errors.push(`Erro ao criar trigger ${trigger.triggerName}: ${result.error}`);
          }
        }
      }

      // 3. Criar tags
      console.log('Criando tags...');
      
      // Primeiro, listar tags existentes
      const existingTagsResult = await this.listTags(workspaceId || '');
      const existingTags = existingTagsResult.success ? existingTagsResult.data : [];
      
      const allTags = [...FACEBOOK_TAGS, ...TIKTOK_TAGS, ...GA4_TAGS];
      for (const tag of allTags) {
        // Verificar se a tag já existe
        const existingTag = existingTags.find((t: any) => t.name === tag.tagName);
        
        if (existingTag) {
          // Tag já existe, pular criação
          console.log(`✅ Tag já existe: ${tag.tagName} (ID: ${existingTag.tagId})`);
          results.tags.push({
            success: true
            // Não incluir resourceId para entidades existentes
          });
        } else {
          // Criar nova tag
          const triggerIds = tag.triggers.map(triggerId => triggerMap[triggerId]).filter(Boolean);
          if (triggerIds.length === 0) {
            errors.push(`Nenhum trigger válido encontrado para tag ${tag.tagName}`);
            continue;
          }

          const result = await this.createTag(tag, triggerIds, workspaceId);
          results.tags.push(result);
          if (!result.success) {
            errors.push(`Erro ao criar tag ${tag.tagName}: ${result.error}`);
          }
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors
      };

    } catch (error: any) {
      errors.push(`Erro geral na configuração: ${error.message}`);
      return {
        success: false,
        results,
        errors
      };
    }
  }

  // Publicar workspace
  async publishWorkspace(workspaceId?: string, versionName?: string): Promise<GTMApiResponse> {
    try {
      const workspace = workspaceId || this.config.workspaceId || '1';
      const response = await this.tagmanager.accounts.containers.workspaces.create_version({
        parent: `accounts/${this.config.accountId}/containers/${this.config.containerId}/workspaces/${workspace}`,
        requestBody: {
          name: versionName || `Auto-setup ${new Date().toISOString()}`,
          notes: 'Configuração automática de tags via API'
        }
      });

      // Verificar se a versão foi criada com sucesso
      if (!response.data.path) {
        throw new Error('Versão criada mas path não encontrado');
      }

      // Publicar a versão
      const publishResponse = await this.tagmanager.accounts.containers.versions.publish({
        path: response.data.path
      });

      return {
        success: true,
        data: publishResponse.data,
        resourceId: publishResponse.data.containerVersionId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utilitários privados
  private buildVariableParameters(variable: any) {
    switch (variable.variableType) {
      case 'c': // Constant variable
        return [
          { type: 'template', key: 'value', value: variable.value || '' }
        ];
      case 'v': // Data Layer variable
        return [
          { type: 'template', key: 'name', value: variable.dataLayerVariable }
        ];
      default:
        return [];
    }
  }

  private buildTagParameters(tag: GTMTagConfig) {
    const parameters: any[] = [];

    switch (tag.tagType) {
      case 'facebookPixel':
        // Para Facebook Pixel, usar Custom HTML
        const fbEventName = tag.parameters.eventName || 'PageView';
        const fbHtml = `
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${tag.parameters.pixelId}');
fbq('track', '${fbEventName}');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${tag.parameters.pixelId}&ev=${fbEventName}&noscript=1"/>
</noscript>
<!-- End Facebook Pixel Code -->`;
        parameters.push({ type: 'template', key: 'html', value: fbHtml });
        break;

      case 'tiktokPixel':
        // Para TikTok Pixel, usar Custom HTML
        const ttEventName = tag.parameters.eventName || 'PageView';
        const ttHtml = `
<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${tag.parameters.pixelId}');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`;
        parameters.push({ type: 'template', key: 'html', value: ttHtml });
        break;

      case 'ga4Config':
        // GA4 Configuration Tag (gaawc)
        parameters.push(
          { type: 'template', key: 'measurementId', value: tag.parameters.measurementId }
        );
        if (tag.parameters.sendPageView) {
          parameters.push({ type: 'boolean', key: 'sendPageView', value: 'true' });
        }
        if (tag.parameters.enhancedConversions) {
          parameters.push({ type: 'boolean', key: 'enableSendToServerContainer', value: 'false' });
        }
        break;

      case 'ga4Event':
        // GA4 Event Tag (gaawe)
        parameters.push(
          { type: 'template', key: 'eventName', value: tag.parameters.eventName }
        );
        
        // Reference to GA4 Config tag - usar o nome da tag GA4 Config
        if (tag.parameters.measurementIdReference) {
          parameters.push({ 
            type: 'TAG_REFERENCE', 
            key: 'measurementId', 
            value: 'GA4 Configuration' // Nome da tag GA4 Config
          });
        }

        // Event parameters
        if (tag.parameters.eventParameters && tag.parameters.eventParameters.length > 0) {
          const eventParams = tag.parameters.eventParameters.map((param: any) => ({
            type: 'map',
            map: [
              { type: 'template', key: 'name', value: param.name },
              { type: 'template', key: 'value', value: param.value }
            ]
          }));
          
          parameters.push({
            type: 'list',
            key: 'eventParameters',
            list: eventParams
          });
        }
        break;
    }

    return parameters;
  }

  private mapTagType(tagType: string): string {
    const typeMap: Record<string, string> = {
      'facebookPixel': 'html',
      'tiktokPixel': 'html',
      'ga4Config': 'gaawc',
      'ga4Event': 'gaawe'
    };
    return typeMap[tagType] || tagType;
  }
}

// Função utilitária para configuração rápida
export async function setupGTMAutomatically(config: GTMApiConfig): Promise<{
  success: boolean;
  workspaceId?: string;
  versionId?: string;
  errors: string[];
}> {
  try {
    const client = new GTMApiClient(config);
    
    let workspaceId: string;
    
    // Tentar criar um novo workspace
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const workspaceResult = await client.createWorkspace(
      `Auto Setup ${timestamp}`,
      'Workspace criado automaticamente pelo script de setup'
    );
    
    if (workspaceResult.success) {
      workspaceId = workspaceResult.resourceId!;
    } else {
      // Se falhar, tentar usar um workspace existente
      console.log('⚠️  Falha ao criar workspace, tentando usar workspace existente...');
      const listResult = await client.listWorkspaces();
      
      if (listResult.success && listResult.data.length > 0) {
        // Usar o primeiro workspace disponível
        workspaceId = listResult.data[0].workspaceId;
        console.log(`📁 Usando workspace existente: ${listResult.data[0].name} (ID: ${workspaceId})`);
      } else {
        return {
          success: false,
          errors: [`Erro ao criar workspace: ${workspaceResult.error}`, `Erro ao listar workspaces: ${listResult.error || 'Nenhum workspace encontrado'}`]
        };
      }
    }

    // Configurar todas as tags
    const setupResult = await client.setupAllTags(workspaceId);
    
    if (setupResult.success) {
      // Verificar se houve mudanças (novas criações)
      // Apenas resultados com resourceId indicam criação nova
      const hasNewCreations = setupResult.results.variables.some(v => v.success && v.resourceId) ||
                             setupResult.results.triggers.some(t => t.success && t.resourceId) ||
                             setupResult.results.tags.some(tag => tag.success && tag.resourceId);
      
      if (hasNewCreations) {
        // Publicar apenas se houve mudanças
        const publishResult = await client.publishWorkspace(workspaceId);
        
        return {
          success: publishResult.success,
          workspaceId,
          versionId: publishResult.resourceId,
          errors: publishResult.success ? [] : [publishResult.error!]
        };
      } else {
        // Todas as tags já existem, não há necessidade de publicar
        return {
          success: true,
          workspaceId,
          errors: []
        };
      }
    } else {
      return {
        success: false,
        workspaceId,
        errors: setupResult.errors
      };
    }

  } catch (error: any) {
    return {
      success: false,
      errors: [`Erro geral: ${error.message}`]
    };
  }
}