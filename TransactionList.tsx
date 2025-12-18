import React from 'react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Trash2, User, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  
  const getPaymentIcon = (type: string) => {
      switch(type) {
          case 'UPI': return <Smartphone className="w-3 h-3" />;
          case 'Card': return <CreditCard className="w-3 h-3" />;
          case 'Bank': return <Building2 className="w-3 h-3" />;
          default: return <Banknote className="w-3 h-3" />; // Cash
      }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100">
          <ArrowUpRight className="w-8 h-8 text-indigo-300" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No transactions yet</h3>
        <p className="text-slate-500 max-w-xs mx-auto">Add your first income or expense to get detailed financial insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/30 backdrop-blur-sm flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-base md:text-lg">Recent Transactions</h3>
        <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
            {transactions.length} entries
        </span>
      </div>
      <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
        {transactions.map((t) => (
          <div key={t.id} className="p-3 md:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-all duration-200 group">
            <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
              <div className={`p-2.5 md:p-3 rounded-2xl shadow-sm flex-shrink-0 ${
                t.type === 'credit' 
                ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600' 
                : 'bg-gradient-to-br from-rose-100 to-orange-100 text-rose-600'
              }`}>
                {t.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm md:text-base mb-0.5 truncate pr-2">{t.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 whitespace-nowrap">{t.category}</span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                  
                  {/* Payment Type Badge */}
                  <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap" title="Payment Mode">
                    {getPaymentIcon(t.paymentType)}
                    {t.paymentType || 'Cash'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-2">
              <div className="text-right">
                <p className={`font-bold text-base md:text-lg whitespace-nowrap ${
                    t.type === 'credit' ? 'text-emerald-600' : 'text-slate-800'
                }`}>
                    {t.type === 'credit' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 sm:hidden">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</p>
              </div>
              <button 
                onClick={() => onDelete(t.id)}
                className="text-slate-400 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-all p-1.5 md:p-2 hover:bg-red-50 rounded-lg"
                title="Delete transaction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};