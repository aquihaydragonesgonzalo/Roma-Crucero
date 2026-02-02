import React from 'react';
import { Wallet } from 'lucide-react';
import { Activity } from '../types';

interface BudgetProps {
    itinerary: Activity[];
}

const Budget: React.FC<BudgetProps> = ({ itinerary }) => {
    const total = itinerary.reduce((acc, curr) => acc + curr.priceEUR, 0);
    return (
        <div className="pb-24 px-4 pt-6 max-w-lg mx-auto h-full overflow-y-auto no-scrollbar fade-in">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-red-800 flex items-center"><Wallet className="mr-2" /> Presupuesto</h2></div>
            <div className="bg-red-800 rounded-2xl p-6 text-white shadow-lg mb-8">
                <p className="text-red-100 text-sm uppercase mb-1">Total Estimado</p>
                <div className="text-4xl font-bold">€{total}</div>
                <p className="text-xs mt-2 italic opacity-80">Incluye BIRG Ticket (12€) y otros buses.</p>
            </div>
            <div className="bg-white rounded-lg border shadow-sm divide-y">
                {itinerary.filter(a => a.priceEUR > 0).map(act => (
                    <div key={act.id} className="p-4 flex justify-between">
                        <div><p className="text-sm font-bold">{act.title}</p><p className="text-xs text-gray-500 capitalize">{act.type}</p></div>
                        <div className="font-bold">€{act.priceEUR}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Budget;