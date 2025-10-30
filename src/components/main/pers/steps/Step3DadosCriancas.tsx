'use client';

import { useState, useEffect } from 'react';
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
import ProgressBar from '../shared/ProgressBar';
import Navigation from '../shared/Navigation';
import OrderSummary from '../shared/OrderSummary';
import StepsLayout from '../layout/StepsLayout';

// Função para validar CPF
const isValidCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

// Função para formatar CPF
const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
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
  const { trackPageView, trackFormInteraction, trackStepProgress, trackBeginCheckout } = useDataLayer();
  const { sessionId } = useUtmTracking();
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
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        updateChild(index, 'foto', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para fazer upload das fotos para R2
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

      // Converter base64 para File objects
      for (let i = 0; i < photosToUpload.length; i++) {
        const child = photosToUpload[i];
        if (child.foto) {
          try {
            // Converter base64 para blob de forma mais robusta
            const base64Data = child.foto.split(',')[1]; // Remove o prefixo data:image/...;base64,
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let j = 0; j < byteCharacters.length; j++) {
              byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            
            // Criar File object
            const file = new File([blob], `child_${i + 1}_photo.jpg`, { type: 'image/jpeg' });
            formData.append(`file${i}`, file);
          } catch (conversionError) {
            console.error(`Erro ao converter foto da criança ${i + 1}:`, conversionError);
            throw new Error(`Erro ao processar foto da criança ${i + 1}`);
          }
        }
      }

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
            console.log('Dados enviados para N8N com sucesso, redirecionando para checkout...');
            await generateAndRedirect(persData);
          } else {
            console.error('Falha ao enviar dados para N8N:', n8nResult.error);
            setErrors([n8nResult.error || 'Erro ao processar pedido. Tente novamente.']);
          }
        } catch (photoError) {
          console.error('Erro ao fazer upload das fotos:', photoError);
          setErrors(['Erro ao fazer upload das fotos. Tente novamente.']);
        }
      } else {
        setErrors(['Erro ao processar checkout']);
      }
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      setErrors(['Erro ao processar dados']);
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
              {(t && t('step3.title')) || 'Dados das Crianças'}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {(t && t('step3.subtitle')) || 'Preencha os dados das crianças para personalizar os recadinhos'}
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
                    {(t && t('step3.childTitle')) || 'Criança'} {index + 1}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Nome da criança */}
                <div className="space-y-2">
                  <label className="block text-xl font-medium text-black">
                    Nome da Criança *
                  </label>
                  <input
                    type="text"
                    value={child.nome}
                    onChange={(e) => updateChild(index, 'nome', e.target.value)}
                    placeholder={(t && t('step3.namePlaceholder')) || 'Digite o nome da criança'}
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
                        accept="image/*"
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
                            <span className="text-xl text-green-600">Foto carregada!</span>
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
                placeholder={(t && t('step3.messagePlaceholder')) || 'Digite sua mensagem personalizada aqui...'}
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
                  Informações de Contato
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="space-y-2">
                  <label className="block text-xl font-medium text-gray-700">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={contactData.nome}
                    onChange={(e) => setContactData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-xl font-medium text-gray-700">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <label className="block text-xl font-medium text-gray-700">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={contactData.telefone}
                    onChange={(e) => setContactData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 border border-gray-300 text-black rounded-xl focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* CPF */}
                <div className="space-y-2">
                  <label className="block text-xl font-medium text-gray-700">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={contactData.cpf || ''}
                    onChange={(e) => {
                      const formattedCPF = formatCPF(e.target.value);
                      setContactData(prev => ({ ...prev, cpf: formattedCPF }));
                    }}
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h4 className="font-medium text-red-800">Corrija os seguintes erros:</h4>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {errors && errors.length > 0 && errors.map((error, index) => (
                <li key={index} className="text-xl text-red-700">{error}</li>
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
    </StepsLayout>
  );
}