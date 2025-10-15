import React, { useState } from 'react';
import { generateAndUploadMockData } from '../mock-data';

const Settings: React.FC = () => {
    const [isGeneratingData, setIsGeneratingData] = useState(false);

    const handleGenerateData = async () => {
        if (isGeneratingData) return;

        const confirmation = window.confirm(
            "Tem certeza que deseja adicionar 10 jogadores e 36 jogos de teste ao banco de dados? Esta ação não pode ser desfeita e irá adicionar dados à sua base atual."
        );

        if (confirmation) {
            setIsGeneratingData(true);
            const success = await generateAndUploadMockData();
            if (success) {
                alert('Dados de teste gerados com sucesso!');
            } else {
                alert('Ocorreu um erro ao gerar os dados. Verifique o console para mais detalhes.');
            }
            setIsGeneratingData(false);
        }
    };

    return (
        <div className="bg-poker-light p-4 md:p-6 rounded-lg shadow-xl max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Configurações</h2>
            
            <div className="space-y-6">
                {/* Seção de Dados de Teste */}
                <div className="bg-poker-dark p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">Dados de Teste</h3>
                    <p className="text-sm text-poker-gray mb-4">
                        Popule o aplicativo com dados de exemplo para testar as funcionalidades de ranking e histórico.
                        Serão criados 10 jogadores e 36 jogos aleatórios.
                    </p>
                    <button
                        onClick={handleGenerateData}
                        disabled={isGeneratingData}
                        className="px-4 py-2 text-sm font-semibold text-poker-gold bg-transparent border border-poker-gold hover:bg-poker-gold/10 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isGeneratingData ? 'Gerando...' : 'Gerar Dados de Teste'}
                    </button>
                </div>

                {/* Seção de Valores Padrão (Exemplo) */}
                <div className="bg-poker-dark p-4 rounded-lg opacity-50">
                     <h3 className="text-lg font-semibold text-white mb-2">Valores Padrão (Em breve)</h3>
                    <p className="text-sm text-poker-gray mb-4">
                        Defina valores padrão para buy-in e rebuys para agilizar o início de novos jogos.
                    </p>
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="text-xs text-poker-gray">Buy-in Padrão</label>
                            <input type="number" value="50" disabled className="w-24 bg-poker-light border border-poker-gray/20 text-white text-sm rounded-lg p-2 cursor-not-allowed" />
                        </div>
                         <div>
                            <label className="text-xs text-poker-gray">Rebuy Padrão</label>
                            <input type="number" value="50" disabled className="w-24 bg-poker-light border border-poker-gray/20 text-white text-sm rounded-lg p-2 cursor-not-allowed" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
