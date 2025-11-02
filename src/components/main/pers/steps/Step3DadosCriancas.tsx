'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PersData, Crianca, ContactData, STORAGE_KEYS } from '../types';
import { getPersonalizationData, savePersonalizationData } from '../utils/dataStorage';
import { useCheckoutUrlGenerator } from '../../../../hooks/useCheckoutUrlGenerator';
import { useN8NIntegration } from '../../../../hooks/useN8NIntegration';
import { useProducts } from '../../../../hooks/useProducts';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { useDataLayer } from '../../../../hooks/useDataLayer';
import { useUtmTracking } from '../../../../hooks/useUtmTracking';
import { useDebugTracking } from '../../../../lib/debug-tracking';
import ProgressBar from '../shared/ProgressBar';
import Navigation from '../shared/Navigation';
import OrderSummary from '../shared/OrderSummary';
import StepsLayout from '../layout/StepsLayout';
import CheckoutRedirectPopup from '../../../CheckoutRedirectPopup';

// Cache para validação de CPF
const cpfValidationCache = new Map<string, boolean>();

// Função para detectar dispositivos móveis
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Função para detectar iOS/Safari
const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Função para detectar Safari
const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// Função otimizada para validar CPF com cache
const isValidCPF = (cpf: string): boolean => {
  // Verificar cache primeiro
  if (cpfValidationCache.has(cpf)) {
    return cpfValidationCache.get(cpf)!;
  }

  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    cpfValidationCache.set(cpf, false);
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    cpfValidationCache.set(cpf, false);
    return false;
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    cpfValidationCache.set(cpf, false);
    return false;
  }
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    cpfValidationCache.set(cpf, false);
    return false;
  }
  
  // Limitar tamanho do cache
  if (cpfValidationCache.size > 100) {
    const firstKey = cpfValidationCache.keys().next().value;
    if (firstKey !== undefined) {
      cpfValidationCache.delete(firstKey);
    }
  }
  
  cpfValidationCache.set(cpf, true);
  return true;
};

// Cache para formatação de CPF
const cpfFormatCache = new Map<string, string>();

// Função otimizada para formatar CPF com cache
const formatCPF = (value: string): string => {
  // Verificar cache primeiro
  if (cpfFormatCache.has(value)) {
    return cpfFormatCache.get(value)!;
  }

  // Remove tudo que não é dígito
  const cleanValue = value.replace(/\D/g, '');
  
  let formatted: string;
  
  // Aplica a máscara
  if (cleanValue.length <= 3) {
    formatted = cleanValue;
  } else if (cleanValue.length <= 6) {
    formatted = `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  } else if (cleanValue.length <= 9) {
    formatted = `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  } else {
    formatted = `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
  }
  
  // Limitar tamanho do cache
  if (cpfFormatCache.size > 50) {
    const firstKey = cpfFormatCache.keys().next().value;
    if (firstKey !== undefined) {
      cpfFormatCache.delete(firstKey);
    }
  }
  
  cpfFormatCache.set(value, formatted);
  return formatted;
};

// Cache para formatação de telefone
const phoneFormatCache = new Map<string, string>();

// Função otimizada para formatar telefone com cache
const formatPhone = (value: string): string => {
  // Verificar cache primeiro
  if (phoneFormatCache.has(value)) {
    return phoneFormatCache.get(value)!;
  }

  // Remove tudo que não é dígito
  const cleanValue = value.replace(/\D/g, '');
  
  let formatted: string;
  
  // Aplica a máscara baseada no tamanho
  if (cleanValue.length <= 2) {
    formatted = cleanValue;
  } else if (cleanValue.length <= 6) {
    formatted = `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
  } else if (cleanValue.length <= 10) {
    formatted = `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 6)}-${cleanValue.slice(6)}`;
  } else {
    // Para celular com 11 dígitos
    formatted = `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
  }
  
  // Limitar tamanho do cache
  if (phoneFormatCache.size > 50) {
    const firstKey = phoneFormatCache.keys().next().value;
    if (firstKey !== undefined) {
      phoneFormatCache.delete(firstKey);
    }
  }
  
  phoneFormatCache.set(value, formatted);
  return formatted;
};

interface Step3DadosCriancasProps {
  buildPersonalizationLink: (path: string) => string;
  t: (key: string) => string;
  locale: 'pt' | 'en' | 'es';
}

export default function Step3DadosCriancas({
  buildPersonalizationLink,
  t,
  locale
}: Step3DadosCriancasProps) {
  const router = useRouter();
  const { generateAndRedirect, validateForCheckout } = useCheckoutUrlGenerator(locale);
  const { validateAndSubmit } = useN8NIntegration();
  const { getMainProductByChildren, getOrderBumps, getProductPrice } = useProducts();
  const isMobile = useIsMobile(1024);
  const { trackPageView, trackFormInteraction, trackStepProgress, trackBeginCheckout, trackMainFunnelProgress } = useDataLayer();
  const { sessionId } = useUtmTracking();
  const { trackFormFill, trackFinalLinkClick } = useDebugTracking();
  const [children, setChildren] = useState<Crianca[]>([{ nome: '' }]); // Inicializar com pelo menos uma criança
  const [mensagem, setMensagem] = useState('');
  const [contactData, setContactData] = useState<ContactData>({
    nome: '',
    email: '',
    telefone: '',
    cpf: ''
  });
  const [quantidadeCriancas, setQuantidadeCriancas] = useState<number>(1);
  const [orderBumps, setOrderBumps] = useState<string[]>([]);
  const [incluirFotos, setIncluirFotos] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cpfValidationTimeout, setCpfValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showRedirectPopup, setShowRedirectPopup] = useState(false);

  // Handler otimizado para mudança de CPF com debounce
  const handleCpfChange = useCallback((value: string) => {
    const formattedCPF = formatCPF(value);
    setContactData(prev => ({ ...prev, cpf: formattedCPF }));
    
    // Limpar timeout anterior
    if (cpfValidationTimeout) {
      clearTimeout(cpfValidationTimeout);
    }
    
    // Debounce da validação para evitar validações desnecessárias
    const newTimeout = setTimeout(() => {
      if (formattedCPF.length >= 14) {
        isValidCPF(formattedCPF); // Pré-validar e cachear
      }
    }, 300);
    
    setCpfValidationTimeout(newTimeout);
  }, [cpfValidationTimeout]);

  // Handler para formatação de telefone
  const handlePhoneChange = useCallback((value: string) => {
    const formattedPhone = formatPhone(value);
    setContactData(prev => ({ ...prev, telefone: formattedPhone }));
  }, []);

  // Cleanup do timeout
  useEffect(() => {
    return () => {
      if (cpfValidationTimeout) {
        clearTimeout(cpfValidationTimeout);
      }
    };
  }, [cpfValidationTimeout]);



  // Track page view
  useEffect(() => {
    trackPageView({
      pageTitle: 'Dados das Crianças - Personalização',
      pagePath: `/${locale}/pers/4`,
      stepNumber: 4,
      stepName: 'children_data'
    });
  }, [trackPageView, locale]);

  // Carregar dados salvos na inicialização usando as funções de dataStorage
  useEffect(() => {
    const persData = getPersonalizationData();
    
    // Carregar quantidade de crianças
    const quantidade = persData.quantidade_criancas || 1;
    setQuantidadeCriancas(quantidade);
    
    // Inicializar array de crianças baseado na quantidade
    // Garantir que sempre temos pelo menos uma criança
    const initialChildren = Array.from({ length: Math.max(quantidade, 1) }, (_, index) => {
      return persData.children && persData.children[index] ? persData.children[index] : { nome: '' };
    });
    setChildren(initialChildren);
    
    // Carregar outros dados
    if (persData.mensagem && persData.mensagem !== 'default') {
      setMensagem(persData.mensagem);
    }
    
    if (persData.contato) {
      setContactData(persData.contato);
    }
    
    // Carregar order bumps e determinar se deve incluir fotos
    setOrderBumps(persData.order_bumps || []);
    const shouldIncludePhotos = persData.order_bumps && (
      persData.order_bumps.includes('child-photo') || 
      persData.order_bumps.includes('combo-addons')
    );
    setIncluirFotos(shouldIncludePhotos || false);
    
    // Marcar como inicializado
    setIsInitialized(true);
  }, []);

  // Escutar mudanças no localStorage (quando outros steps atualizam os dados)
  useEffect(() => {
    const handleStorageChange = () => {
      const persData = getPersonalizationData();
      
      // Verificar se a quantidade de crianças mudou
      if (persData.quantidade_criancas !== quantidadeCriancas) {
        setQuantidadeCriancas(persData.quantidade_criancas);
        
        // Atualizar array de crianças preservando dados existentes
        const updatedChildren = Array.from({ length: persData.quantidade_criancas }, (_, index) => {
          return persData.children && persData.children[index] ? persData.children[index] : { nome: '' };
        });
        setChildren(updatedChildren);
      }
      
      // Atualizar order bumps se mudaram
      const currentOrderBumps = JSON.stringify(orderBumps.sort());
      const newOrderBumps = JSON.stringify(persData.order_bumps.sort());
      
      if (currentOrderBumps !== newOrderBumps) {
        setOrderBumps(persData.order_bumps);
        
        // Atualizar estado de incluir fotos baseado nos order bumps 'child-photo' ou 'combo-addons'
        const shouldIncludePhotos = persData.order_bumps.includes('child-photo') || 
                                   persData.order_bumps.includes('combo-addons');
        setIncluirFotos(shouldIncludePhotos);
      }
    };

    // Escutar evento customizado de mudança no localStorage
    window.addEventListener('localStorageChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, [quantidadeCriancas, orderBumps]);

  // Salvar dados automaticamente usando as funções de dataStorage
  useEffect(() => {
    // Só salvar após a inicialização para evitar sobrescrever dados carregados
    if (!isInitialized) return;
    
    const dataToSave: Partial<PersData> = {
      quantidade_criancas: quantidadeCriancas,
      children: children,
      mensagem: mensagem,
      contato: contactData,
      order_bumps: orderBumps,
      incluir_fotos: incluirFotos
    };
    
    savePersonalizationData(dataToSave);
  }, [children, mensagem, contactData, quantidadeCriancas, orderBumps, incluirFotos, isInitialized]);

  const updateChild = (index: number, field: keyof Crianca, value: string | number) => {
    const updatedChildren = [...children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setChildren(updatedChildren);

    // Track form interaction
    trackFormInteraction({
      formName: 'children_data',
      fieldName: `child_${index + 1}_${field}`,
      stepNumber: 4,
      interactionType: 'change'
    });
  };

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações específicas para dispositivos móveis
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp',
      'image/heic',  // Formato padrão do iPhone
      'image/heif'   // Formato alternativo do iPhone
    ];

    // Validar tamanho do arquivo
    if (file.size > maxSize) {
      setErrors([`Foto da criança ${index + 1} é muito grande. Máximo 10MB.`]);
      return;
    }

    // Validar tipo do arquivo
    if (!allowedTypes.includes(file.type)) {
      setErrors([`Formato da foto da criança ${index + 1} não suportado. Use JPG, PNG, WEBP, HEIC ou HEIF.`]);
      return;
    }

    // Limpar erros anteriores
    setErrors([]);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const base64 = e.target?.result as string;
        if (base64) {
          updateChild(index, 'foto', base64);
          console.log(`✅ Foto da criança ${index + 1} carregada com sucesso`);
        }
      } catch (error) {
        console.error(`Erro ao processar foto da criança ${index + 1}:`, error);
        setErrors([`Erro ao processar foto da criança ${index + 1}. Tente novamente.`]);
      }
    };

    reader.onerror = (error) => {
      console.error(`Erro ao ler arquivo da criança ${index + 1}:`, error);
      setErrors([`Erro ao ler foto da criança ${index + 1}. Tente selecionar novamente.`]);
    };

    reader.onabort = () => {
      console.warn(`Upload da foto da criança ${index + 1} foi cancelado`);
      setErrors([`Upload da foto da criança ${index + 1} foi cancelado.`]);
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(`Erro ao iniciar leitura da foto da criança ${index + 1}:`, error);
      setErrors([`Erro ao processar foto da criança ${index + 1}. Tente novamente.`]);
    }
  };

  // Função melhorada para converter base64 para File com compatibilidade Safari/iOS
  const convertBase64ToFile = async (base64: string, index: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      try {
        // Validar formato base64
        if (!base64 || !base64.includes('data:image/')) {
          reject(new Error(`Foto ${index + 1} tem formato inválido`));
          return;
        }
        
        const processConversion = () => {
          try {
            // Extrair dados base64 e tipo MIME
            const [header, base64Data] = base64.split(',');
            if (!base64Data) {
              throw new Error(`Foto ${index + 1} não contém dados válidos`);
            }
            
            // Extrair tipo MIME do header
            const mimeMatch = header.match(/data:([^;]+)/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            
            // Detectar dispositivo para escolher melhor método
            const isIOS = isIOSDevice();
            const isMobile = isMobileDevice();
            const safari = isSafari();

            console.log(`🔍 Dispositivo detectado - iOS: ${isIOS}, Mobile: ${isMobile}, Safari: ${safari}`);

            // Para iOS/Safari, usar sempre atob que é mais confiável
            if (isIOS || safari) {
              try {
                const binaryString = atob(base64Data);
                
                // Processar em chunks para evitar problemas de memória em dispositivos móveis
                const chunkSize = isMobile ? 8192 : 16384;
                const chunks: BlobPart[] = [];
                
                for (let i = 0; i < binaryString.length; i += chunkSize) {
                  const chunk = binaryString.slice(i, i + chunkSize);
                  const chunkArray = new Uint8Array(chunk.length);
                  
                  for (let j = 0; j < chunk.length; j++) {
                    chunkArray[j] = chunk.charCodeAt(j);
                  }
                  
                  chunks.push(chunkArray);
                }
                
                const blob = new Blob(chunks, { type: mimeType });
                const fileName = `child_${index + 1}_photo_${Date.now()}.jpg`;
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                
                resolve(file);
              } catch (atobError) {
                console.error('Erro no atob para iOS/Safari:', atobError);
                reject(new Error(`Erro ao processar foto ${index + 1} no dispositivo iOS`));
              }
            } else {
              // Para outros navegadores, tentar atob primeiro, depois fetch
              try {
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Criar blob e file
                const blob = new Blob([bytes], { type: mimeType });
                const fileName = `child_${index + 1}_photo_${Date.now()}.jpg`;
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                
                resolve(file);
              } catch (atobError) {
                // Fallback para fetch se atob falhar
                fetch(base64)
                  .then(res => res.blob())
                  .then(blob => {
                    const fileName = `child_${index + 1}_photo_${Date.now()}.jpg`;
                    const file = new File([blob], fileName, { type: 'image/jpeg' });
                    resolve(file);
                  })
                  .catch(fetchError => {
                    console.error(`Erro na conversão da foto ${index + 1}:`, { atobError, fetchError });
                    reject(new Error(`Erro ao processar foto ${index + 1}. Tente novamente.`));
                  });
              }
            }
          } catch (error) {
            reject(error);
          }
        };

        // Usar requestIdleCallback se disponível, senão setTimeout
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(processConversion, { timeout: 5000 });
        } else {
          setTimeout(processConversion, 0);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Função para fazer upload das fotos para R2 (otimizada)
  const uploadPhotosToR2 = async (sessionId: string, persData: PersData, contactData: ContactData): Promise<string[]> => {
    const photosToUpload = children.filter(child => child.foto && child.foto.startsWith('data:'));
    
    if (photosToUpload.length === 0) {
      return [];
    }

    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);

      // Adicionar dados de contato
      formData.append('nome', contactData.nome);
      formData.append('email', contactData.email);
      formData.append('telefone', contactData.telefone);
      formData.append('cpf', contactData.cpf);

      // Adicionar dados das crianças
      const criancasNomes = persData.children.map(child => child.nome);
      formData.append('criancas', JSON.stringify(criancasNomes));

      // Adicionar mensagem
      formData.append('mensagem', persData.mensagem);

      // Adicionar order bumps
      formData.append('order_bumps_site', JSON.stringify(persData.order_bumps));

      // Converter base64 para File objects de forma assíncrona e paralela
      const conversionPromises = photosToUpload.map((child, i) => 
        child.foto ? convertBase64ToFile(child.foto, i) : Promise.resolve(null)
      );

      const files = await Promise.all(conversionPromises);
      
      // Adicionar arquivos ao FormData
      files.forEach((file, i) => {
        if (file) {
          formData.append(`file${i}`, file);
        }
      });

      const uploadResponse = await fetch('/api/save-photos', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const result = await uploadResponse.json();
      
      if (result.success && result.data?.fotos_salvas) {
        return result.data.fotos_salvas;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Erro ao fazer upload das fotos:', error);
      throw error;
    }
  };

  const handleNext = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrors([]);

    try {
      // Validar dados das crianças
      const childrenErrors: string[] = [];
      children.forEach((child, index) => {
        if (!child.nome.trim()) {
          childrenErrors.push(`Nome da criança ${index + 1} é obrigatório`);
        }
      });

      // Validar mensagem
      if (!mensagem.trim()) {
        childrenErrors.push('Mensagem personalizada é obrigatória');
      }

      // Validar dados de contato
      if (!contactData.nome.trim()) {
        childrenErrors.push('Nome é obrigatório');
      }
      if (!contactData.email.trim()) {
        childrenErrors.push('E-mail é obrigatório');
      }
      if (!contactData.telefone.trim()) {
        childrenErrors.push('Telefone é obrigatório');
      }
      if (!contactData.cpf?.trim()) {
        childrenErrors.push('CPF é obrigatório');
      } else if (!isValidCPF(contactData.cpf)) {
        childrenErrors.push('CPF inválido');
      }

      if (childrenErrors.length > 0) {
        setErrors(childrenErrors);
        setIsLoading(false);
        return;
      }

      // 🎯 DEBUG TRACKING: Formulário preenchido com sucesso para Meta e TikTok
      trackFormFill(3, 'Dados das Crianças', {
        children_count: children.length,
        has_message: !!mensagem.trim(),
        contact_complete: !!(contactData.nome && contactData.email && contactData.telefone && contactData.cpf)
      });

      // Carregar dados existentes
      const existingData = localStorage.getItem(STORAGE_KEYS.PERS_DATA);
      let persData: PersData;
      
      if (existingData) {
        persData = JSON.parse(existingData);
      } else {
        persData = {
          quantidade_criancas: quantidadeCriancas,
          children: [],
          mensagem: '',
          incluir_fotos: false,
          order_bumps: orderBumps
        };
      }

      // Atualizar dados
      persData.children = children;
      persData.mensagem = mensagem;
      persData.contato = contactData;
      persData.order_bumps = orderBumps; // Atualizar order bumps com o estado atual

      // Salvar dados
      localStorage.setItem(STORAGE_KEYS.PERS_DATA, JSON.stringify(persData));

      // Track step progress to checkout
      trackStepProgress({
        stepFrom: 4,
        stepTo: 5,
        stepName: 'children_data_to_checkout'
      });

      // Track checkout initiation
      const mainProduct = getMainProductByChildren(persData.quantidade_criancas);
      const availableOrderBumps = getOrderBumps();
      
      if (mainProduct) {
        const checkoutItems = [
          {
            item_id: mainProduct.id,
            item_name: mainProduct.title.pt,
            item_category: 'main_product',
            price: getProductPrice(mainProduct).price,
            quantity: 1
          },
          ...persData.order_bumps.map(bumpId => {
            const bump = availableOrderBumps.find(b => b.id === bumpId);
            return {
              item_id: bumpId,
              item_name: bump?.title?.pt || 'Order Bump',
              item_category: 'order_bump',
              price: bump ? getProductPrice(bump).price : 0,
              quantity: 1
            };
          })
        ];

        const totalValue = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        trackBeginCheckout({
          currency: locale === 'pt' ? 'BRL' : 'USD',
          value: totalValue,
          items: checkoutItems,
          checkoutStep: 1
        });
      }

      // Validar para checkout
      const isValid = validateForCheckout(persData);
      if (isValid) {
        console.log('Dados válidos, processando fotos e enviando para N8N...', persData);
        
        // Mostrar popup de redirecionamento
        setShowRedirectPopup(true);
        
        try {
          // Fazer upload das fotos primeiro (se houver)
          const hasPhotos = children.some(child => child.foto && child.foto.startsWith('data:'));
          let photoUrls: string[] = [];
          
          if (hasPhotos) {
            console.log('📸 Fazendo upload das fotos...');
            console.log('Crianças com fotos para upload:', children.filter(child => child.foto && child.foto.startsWith('data:')));
            
            photoUrls = await uploadPhotosToR2(sessionId, persData, contactData);
            console.log('✅ Upload das fotos concluído:', photoUrls);
            console.log('Número de URLs retornadas:', photoUrls.length);
            
            // Atualizar persData com as URLs das fotos (usar 'fotos' em vez de 'photo_urls')
            persData.fotos = photoUrls;
            persData.incluir_fotos = true;
            
            console.log('📝 Atualizando persData com fotos:', {
              fotos: persData.fotos,
              incluir_fotos: persData.incluir_fotos
            });
            
            // Salvar dados atualizados
            localStorage.setItem(STORAGE_KEYS.PERS_DATA, JSON.stringify(persData));
            console.log('💾 Dados salvos no localStorage com fotos atualizadas');
          }
          
          // Submeter para N8N
          const n8nResult = await validateAndSubmit(persData, contactData);
          
          if (n8nResult.success) {
            // Verificar se foi usado modo fallback
            const response = n8nResult.response as { message?: string };
            if (response?.message?.includes('modo offline')) {
              console.log('Dados salvos em modo fallback, redirecionando para checkout...');
              // Mostrar mensagem informativa mas continuar para checkout
              console.info('ℹ️ Seus dados foram salvos e serão processados assim que o servidor estiver disponível.');
            } else {
              console.log('Dados enviados para N8N com sucesso, redirecionando para checkout...');
            }

            // 🎯 DEBUG TRACKING: Clique no botão finalizar para Meta e TikTok
            trackFinalLinkClick('Finalizar Pedido', window.location.href, {
              step: 3,
              children_count: persData.children.length,
              has_order_bumps: persData.order_bumps.length > 0
            });

            await generateAndRedirect(persData);
          } else {
            console.error('Falha ao enviar dados para N8N:', n8nResult.error);
            
            // Mensagens de erro mais amigáveis baseadas no tipo de erro
            let errorMessage = 'Erro ao processar pedido. Tente novamente.';
            const errorMsg = (n8nResult.error || '').toLowerCase();
            
            if (errorMsg.includes('webhook n8n não encontrado') || errorMsg.includes('404')) {
              errorMessage = '⚠️ Nosso sistema está temporariamente indisponível. Seus dados foram salvos e serão processados assim que possível. Você pode continuar com o pedido.';
            } else if (errorMsg.includes('falha na conexão') || errorMsg.includes('network') || errorMsg.includes('fetch failed')) {
              errorMessage = '🌐 Problema de conexão detectado. Verifique sua internet ou tente novamente em alguns minutos.';
            } else if (errorMsg.includes('timeout')) {
              errorMessage = '⏱️ A operação demorou mais que o esperado. Tente novamente.';
            } else if (errorMsg.includes('falha após') && errorMsg.includes('tentativas')) {
              errorMessage = '🔄 Não foi possível conectar ao servidor após várias tentativas. Verifique sua conexão e tente novamente.';
            }
            
            setErrors([errorMessage]);
          }
        } catch (photoError) {
          console.error('Erro ao fazer upload das fotos:', photoError);
          
          // Mensagens de erro mais específicas baseadas no tipo de erro
          let errorMessage = 'Erro ao fazer upload das fotos. Tente novamente.';
          
          if (photoError instanceof Error) {
            const errorMsg = photoError.message.toLowerCase();
            
            if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
              errorMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
            } else if (errorMsg.includes('formato') || errorMsg.includes('invalid')) {
              errorMessage = 'Formato de foto inválido. Use apenas JPG, PNG ou WEBP.';
            } else if (errorMsg.includes('size') || errorMsg.includes('tamanho')) {
              errorMessage = 'Foto muito grande. Tente com uma foto menor.';
            } else if (errorMsg.includes('timeout')) {
              errorMessage = 'Upload demorou muito. Tente com fotos menores.';
            } else if (errorMsg.includes('processar')) {
              errorMessage = 'Erro ao processar as fotos. Tente selecionar as fotos novamente.';
            }
          }
          
          setErrors([errorMessage]);
        }
      } else {
        setErrors(['Por favor, preencha todos os campos obrigatórios.']);
      }
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Erro ao processar dados. Tente novamente.';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('network') || errorMsg.includes('connection')) {
          errorMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
        } else if (errorMsg.includes('timeout')) {
          errorMessage = 'Operação demorou muito. Tente novamente.';
        } else if (errorMsg.includes('validation') || errorMsg.includes('invalid')) {
          errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
        }
      }
      
      setErrors([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    const backUrl = buildPersonalizationLink('2');
    router.push(backUrl);
  };

  return (
    <StepsLayout currentStep={3} locale={locale} t={t} showOrderSummary={false}>
      {/* Progress Bar fixo no topo da página */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <ProgressBar currentStep={3} totalSteps={3} t={t} />
      </div>
      
      <div className="container mx-auto px-5 max-w-7xl pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">

        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="inline-block p-2 backdrop-blur-sm rounded-2xl mb-6">
            <h1 className="text-4xl font-bold font-fertigo font-fertigo text-gray-800 mb-3 bg-black bg-clip-text text-transparent">
              {t('step3.title')}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('step3.subtitle')}
            </p>
          </div>
        </div>

 
        {/* Form */}
        <div className="backdrop-blur-sm rounded-3xl mb-8 animate-slide-up">
          


          {/* Campos das crianças */}
          {children.length > 0 ? (
            children.map((child, index) => (
            <div key={index} className="mb-8 py-2 bg-white rounded-2xl transition-all duration-300 group animate-fade-in-up" style={{animationDelay: `${index * 100}ms`}}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-600 border-2 border-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold font-fertigo text-lg">{index + 1}</span>
                  </div>
                  <h3 className="text-2xl font-bold font-fertigo text-black">
                    {t('step3.childTitle')} {index + 1}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Nome da criança */}
                <div className="space-y-2">
                  <label htmlFor={`child-name-${index}`} className="block text-xl font-medium text-black">
                    Nome da Criança *
                  </label>
                  <input
                    type="text"
                    id={`child-name-${index}`}
                    name={`child-name-${index}`}
                    value={child.nome}
                    onChange={(e) => updateChild(index, 'nome', e.target.value)}
                    placeholder={t('step3.namePlaceholder')}
                    className="w-full px-4 py-3 border text-black border-gray-300 text-black rounded-xl transition-all duration-200"
                  />
                </div>

                {/* Foto da criança - só mostrar se incluirFotos for true */}
                {incluirFotos && (
                  <div className="space-y-2">
                    <label className="block text-xl font-medium text-gray-700">
                      {t('step3.childPhoto') || 'Foto da Criança'}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                        onChange={(e) => handlePhotoUpload(index, e)}
                        className="hidden"
                        id={`photo-${index}`}
                      />
                      <label
                        htmlFor={`photo-${index}`}
                        className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-red-600 rounded-xl hover:border-red-500 cursor-pointer transition-colors duration-200"
                      >
                        {child.foto ? (
                          <div className="flex items-center space-x-2">
                            <Image
                              src={child.foto}
                              alt={`Foto de ${child.nome}`}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                            />
                            <span className="text-xl text-green-700">Foto carregada!</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-xl">Adicionar foto</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
          ) : (
            <div className="mb-4 p-4 bg-red-100 rounded">
              <p>Nenhuma criança encontrada. Array children está vazio.</p>
            </div>
          )}

          {/* Mensagem personalizada */}
          <div className="mb-8 py-6 bg-white rounded-2xl transition-all duration-300 animate-fade-in-up">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold font-fertigo text-gray-800">
                  {t('step3.personalMessage') || 'Mensagem Personalizada'}
                </h3>
              </div>
              
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder={t('step3.messagePlaceholder')}
                rows={4}
                className="w-full px-4 text-black py-3 border border-gray-300 text-black rounded-xl transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {/* Campos de Contato */}
          <div className="mb-8 py-6 bg-white rounded-2xl transition-all duration-300 animate-fade-in-up">
            <div className="">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold font-fertigo text-gray-800">
                  {t('step3.contactInfo')}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <label htmlFor="contact-name" className="block text-xl font-medium text-gray-700">
                    {t('step3.contact.name')} *
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="contact-name"
                    value={contactData.nome}
                    onChange={(e) => setContactData(prev => ({ ...prev, nome: e.target.value }))}
                    onFocus={() => trackFormInteraction({
                      formName: 'contact_data',
                      fieldName: 'name',
                      stepNumber: 4,
                      interactionType: 'start'
                    })}
                    placeholder={t('step3.contact.namePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="contact-email" className="block text-xl font-medium text-gray-700">
                    {t('step3.contact.email')} *
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="contact-email"
                    value={contactData.email}
                    onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                    onFocus={() => trackFormInteraction({
                      formName: 'contact_data',
                      fieldName: 'email',
                      stepNumber: 4,
                      interactionType: 'start'
                    })}
                    placeholder={t('step3.contact.emailPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <label htmlFor="contact-phone" className="block text-xl font-medium text-gray-700">
                    {t('step3.contact.phone')} *
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    name="contact-phone"
                    value={contactData.telefone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onFocus={() => trackFormInteraction({
                      formName: 'contact_data',
                      fieldName: 'phone',
                      stepNumber: 4,
                      interactionType: 'start'
                    })}
                    placeholder={t('step3.contact.phonePlaceholder')}
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* CPF */}
                <div className="space-y-2">
                  <label htmlFor="contact-cpf" className="block text-xl font-medium text-gray-700">
                    CPF *
                  </label>
                  <input
                    type="text"
                    id="contact-cpf"
                    name="contact-cpf"
                    value={contactData.cpf || ''}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    onFocus={() => trackFormInteraction({
                      formName: 'contact_data',
                      fieldName: 'cpf',
                      stepNumber: 4,
                      interactionType: 'start'
                    })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full px-4 py-3 border  border-gray-300 text-black rounded-xl focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exibir erros */}
        {errors.length > 0 && (
          <div className={`mb-6 p-4 rounded-xl animate-shake ${
            errors.some(error => error.includes('⚠️') || error.includes('temporariamente indisponível')) 
              ? 'bg-yellow-50 border border-yellow-200' 
              : errors.some(error => error.includes('🌐') || error.includes('⏱️') || error.includes('🔄'))
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {errors.some(error => error.includes('⚠️')) ? (
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : errors.some(error => error.includes('🌐') || error.includes('⏱️') || error.includes('🔄')) ? (
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <h4 className={`font-medium ${
                errors.some(error => error.includes('⚠️')) 
                  ? 'text-yellow-800' 
                  : errors.some(error => error.includes('🌐') || error.includes('⏱️') || error.includes('🔄'))
                  ? 'text-blue-800'
                  : 'text-red-800'
              }`}>
                {errors.some(error => error.includes('⚠️')) 
                  ? 'Aviso importante:' 
                  : errors.some(error => error.includes('🌐') || error.includes('⏱️') || error.includes('🔄'))
                  ? 'Problema de conectividade:'
                  : 'Corrija os seguintes erros:'
                }
              </h4>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {errors && errors.length > 0 && errors.map((error, index) => (
                <li key={index} className={`text-xl ${
                  error.includes('⚠️') 
                    ? 'text-yellow-700' 
                    : error.includes('🌐') || error.includes('⏱️') || error.includes('🔄')
                    ? 'text-blue-700'
                    : 'text-red-700'
                }`}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* OrderSummary para Mobile - dentro do grid principal */}
        {isMobile && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold font-fertigo text-black mb-6 text-center">
                {t('step2.orderSummary')}
              </h3>
              <OrderSummary 
                locale={locale} 
                showTotal={true}
                className="space-y-4"
                t={t}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <Navigation
          currentStep={3}
          totalSteps={3}
          isLoading={isLoading}
          canGoBack={true}
          onNext={handleNext}
          onBack={handlePrevious}
          t={t}
          nextLabel="Finalizar Pedido"
        />
          </div>
          
          {/* OrderSummary para Desktop - Sidebar */}
          {!isMobile && (
            <div className="lg:col-span-1 mb-10">
              <div className="sticky top-24 animate-slide-in-right">
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold font-fertigo text-black mb-6 text-center">
                    {t('step2.orderSummary')}
                  </h3>
                  <OrderSummary 
                    locale={locale} 
                    showTotal={true}
                    className="space-y-4"
                    t={t}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.7s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out both;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }
      `}</style>

      {/* Popup de redirecionamento para checkout */}
      <CheckoutRedirectPopup 
        isVisible={showRedirectPopup}
        onTimeout={() => {
          console.log('Timeout do popup de redirecionamento');
          setShowRedirectPopup(false);
        }}
      />
    </StepsLayout>
  );
}