import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Caminho para o arquivo products.json
    const filePath = path.join(process.cwd(), 'src', 'app', 'api', 'checkout', 'products', 'products.json');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Arquivo products.json não encontrado' },
        { status: 404 }
      );
    }

    // Ler o arquivo
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const products = JSON.parse(fileContents);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}