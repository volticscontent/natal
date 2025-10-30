export interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  description?: string;
  features?: string[];
}

export interface ProductCarouselProps {
  title?: string;
  products?: Product[];
  onProductClick?: (product: Product) => void;
}

// Dados padrão para demonstração
export const defaultProducts: Product[] = [
  {
    id: '1',
    title: 'Vídeo Personalizado do Papai Noel',
    price: 'R$ 29,90',
    originalPrice: 'R$ 49,90',
    discount: '-40%',
    image: '/images/produto+v.webp',
    description: 'Vídeo personalizado com o nome da criança e mensagem especial',
    features: ['Nome personalizado', 'Mensagem única', 'Qualidade HD']
  },
  {
    id: '2',
    title: 'Carta do Papai Noel',
    price: 'R$ 19,90',
    originalPrice: 'R$ 29,90',
    discount: '-33%',
    image: '/api/placeholder/300/300',
    description: 'Carta física personalizada direto do Polo Norte',
    features: ['Papel especial', 'Selo oficial', 'Entrega em casa']
  },
  {
    id: '3',
    title: 'Kit Completo Natal',
    price: 'R$ 39,90',
    originalPrice: 'R$ 69,90',
    discount: '-43%',
    image: '/api/placeholder/300/300',
    description: 'Vídeo + Carta + Certificado de Bom Comportamento',
    features: ['Vídeo HD', 'Carta física', 'Certificado']
  },
  {
    id: '4',
    title: 'Ligação do Papai Noel',
    price: 'R$ 24,90',
    originalPrice: 'R$ 39,90',
    discount: '-38%',
    image: '/api/placeholder/300/300',
    description: 'Ligação telefônica personalizada do Papai Noel',
    features: ['Conversa real', '5 minutos', 'Horário agendado']
  }
];

// Função para buscar produtos
export const getProducts = (): Product[] => {
  return defaultProducts;
};

// Função para buscar produto por ID
export const getProductById = (id: string): Product | undefined => {
  return defaultProducts.find(product => product.id === id);
};