import React from 'react';

// Import all icon components
import Icon1 from './icons/CashierTransactionIcon';
import Icon2 from './icons/CoinStackIcon';
import Icon3 from './icons/WalletIcon';
import Icon4 from './icons/HandCoinIcon';
import Icon5 from './icons/CashRegisterIcon';
import Icon6 from './icons/ShieldDollarIcon';
import Icon7 from './icons/MoneyBagIcon';
import Icon8 from './icons/FinancialScaleIcon';
import Icon9 from './icons/BillAndCoinIcon';
import Icon10 from './icons/PieChartDollarIcon';

const icons = [
  { Component: Icon1, name: 'Transação Circular' },
  { Component: Icon2, name: 'Pilha de Moedas' },
  { Component: Icon3, name: 'Carteira com Cédula' },
  { Component: Icon4, name: 'Mão e Moeda' },
  { Component: Icon5, name: 'Caixa Registradora' },
  { Component: Icon6, name: 'Cifrão em Escudo' },
  { Component: Icon7, name: 'Saco de Dinheiro' },
  { Component: Icon8, name: 'Balança Financeira' },
  { Component: Icon9, name: 'Cédula e Moeda' },
  { Component: Icon10, name: 'Gráfico de Pizza' },
];

const IconShowcase: React.FC = () => {
  return (
    <div className="bg-poker-dark min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Escolha o Ícone para o "Caixa"</h1>
          <p className="text-poker-gray">Clique no seu ícone preferido ou me diga o número correspondente.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {icons.map((icon, index) => (
            <div
              key={index}
              className="bg-poker-light p-4 rounded-lg shadow-lg flex flex-col items-center justify-center aspect-square text-center cursor-pointer transition-all duration-300 hover:bg-poker-green hover:shadow-poker-gold/20 hover:scale-105"
            >
              <div className="w-16 h-16 text-poker-gold mb-3">
                <icon.Component />
              </div>
              <h3 className="font-semibold text-white text-sm">Ícone {index + 1}</h3>
              <p className="text-xs text-poker-gray">{icon.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IconShowcase;
