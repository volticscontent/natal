import ConnectRateMonitor from '@/components/tracking/ConnectRateMonitorSimple';

export default function TestRoute() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard de Teste - UTMfy Connect Rate</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monitor Detalhado */}
        <div className="lg:col-span-2">
          <ConnectRateMonitor showDetails={true} />
        </div>
        
        {/* Monitor Compacto */}
        <ConnectRateMonitor compact={true} />
        <ConnectRateMonitor compact={true} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">🚀 Sistema Integrado</h2>
        <div className="space-y-2 text-blue-700">
          <p>✅ <strong>Google Tag Manager:</strong> Configurado e enviando eventos automaticamente</p>
          <p>✅ <strong>Connect Rate Tracking:</strong> Monitoramento em tempo real da conectividade UTMfy</p>
          <p>✅ <strong>Data Layer:</strong> Eventos personalizados para análise avançada</p>
          <p>✅ <strong>Circuit Breaker:</strong> Monitoramento de estado dos serviços</p>
          <p>✅ <strong>Métricas de Performance:</strong> Tempo de resposta, uptime e taxa de erro</p>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Eventos GTM Enviados:</h3>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• <code>connect_rate_update</code> - Atualização da taxa de conexão</li>
            <li>• <code>circuit_breaker_state</code> - Mudança de estado do circuit breaker</li>
            <li>• <code>system_health_update</code> - Métricas de saúde do sistema</li>
            <li>• <code>manual_refresh</code> - Atualização manual pelo usuário</li>
            <li>• <code>tracking_started/stopped</code> - Controle de tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}