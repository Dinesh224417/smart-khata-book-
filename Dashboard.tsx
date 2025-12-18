import React, { useState, useEffect, useMemo } from 'react';
import { User, Transaction } from '../types';
import { StorageService } from '../services/storageService';
import { TransactionList } from './TransactionList';
import { SmartAssistant } from './SmartAssistant';
import { Inventory } from './Inventory';
import { ProfileModal } from './ProfileModal';
import { Button } from './Button';
import { Input } from './Input';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  LogOut, 
  Plus, 
  Wallet, 
  Sparkles,
  X,
  LayoutDashboard,
  Users,
  FileDown,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Package,
  User as UserIcon
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

type Tab = 'dashboard' | 'inventory';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New Transaction Form State
  const [newTx, setNewTx] = useState<{
    amount: string;
    type: 'credit' | 'debit';
    description: string;
    category: string;
    paymentType: 'Cash' | 'UPI' | 'Card' | 'Bank' | 'Other';
    customerName: string;
  }>({
    amount: '',
    type: 'debit',
    description: '',
    category: '',
    paymentType: 'Cash',
    customerName: ''
  });

  useEffect(() => {
    setTransactions(StorageService.getTransactions(user.id));
  }, [user.id, activeTab]); 

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'credit')
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const expenseByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });
    
    return Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#f43f5e'];
  const QUICK_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Rent', 'Salary', 'Medical'];

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.description) return;

    setLoading(true);

    let category = newTx.category;
    if (!category) {
       category = await GeminiService.suggestCategory(newTx.description);
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      amount: parseFloat(newTx.amount),
      type: newTx.type,
      description: newTx.description,
      category: category || 'General',
      paymentType: newTx.paymentType,
      customerName: newTx.customerName || undefined,
      date: new Date().toISOString()
    };

    StorageService.saveTransaction(user.id, transaction);
    setTransactions(StorageService.getTransactions(user.id));
    setNewTx({ amount: '', type: 'debit', description: '', category: '', paymentType: 'Cash', customerName: '' });
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
        StorageService.deleteTransaction(user.id, id);
        setTransactions(StorageService.getTransactions(user.id));
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    const companyName = user.companyName || "Smart Khata Book";
    const addressLines = user.address ? doc.splitTextToSize(user.address, 100) : [];
    
    const baseHeaderHeight = 40;
    const addressBlockHeight = addressLines.length > 0 ? (addressLines.length * 5) : 0;
    const headerHeight = Math.max(baseHeaderHeight, 30 + addressBlockHeight + 10);

    doc.setFillColor(79, 70, 229); 
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(companyName, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (addressLines.length > 0) {
        doc.text(addressLines, 14, 28);
    } else {
        doc.text("Financial Statement", 14, 28);
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("STATEMENT", pageWidth - 14, 20, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString(), pageWidth - 14, 28, { align: "right" });

    const contentStartY = headerHeight + 15;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated for: ${user.name}`, 14, contentStartY);

    const boxY = contentStartY + 5;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, boxY, 180, 25, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.text("Total Income", 20, boxY + 8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74); 
    doc.text(`+ ${stats.income.toLocaleString()}`, 20, boxY + 18);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0,0,0);
    doc.setFontSize(10);
    doc.text("Total Expense", 80, boxY + 8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38); 
    doc.text(`- ${stats.expense.toLocaleString()}`, 80, boxY + 18);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0,0,0);
    doc.setFontSize(10);
    doc.text("Net Balance", 140, boxY + 8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229); 
    doc.text(`${stats.balance.toLocaleString()}`, 140, boxY + 18);

    const tableData = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.customerName || '-',
        t.paymentType || 'Cash',
        t.category,
        t.type === 'credit' ? 'Credit' : 'Debit',
        `${t.type === 'credit' ? '+' : '-'} ${t.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: boxY + 35,
        head: [['Date', 'Description', 'Party', 'Mode', 'Category', 'Type', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        columnStyles: {
            6: { halign: 'right', fontStyle: 'bold' } 
        },
        styles: { fontSize: 8, cellPadding: 2 }
    });

    doc.save(`KhataBook_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row relative">
      
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden md:flex bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white w-64 flex-shrink-0 flex-col shadow-2xl z-20 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-violet-500 rounded-lg shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
            KhataBook
          </span>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          {/* User Profile Summary */}
          <div className="mb-6 flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors" onClick={() => setIsProfileOpen(true)}>
             <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-lg font-bold">{user.name.charAt(0)}</span>
                )}
             </div>
             <div className="min-w-0">
                 <p className="font-semibold text-sm truncate">{user.name}</p>
                 <p className="text-xs text-indigo-300 truncate">{user.emailOrMobile}</p>
             </div>
          </div>

          <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider mb-2">My Balance</p>
            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
              ₹{stats.balance.toLocaleString()}
            </p>
          </div>

          <nav className="space-y-2 flex-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'dashboard' 
                ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                : 'text-indigo-100 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-pink-400' : ''}`} />
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'inventory' 
                ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                : 'text-indigo-100 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Package className={`w-5 h-5 ${activeTab === 'inventory' ? 'text-emerald-400' : ''}`} />
              Inventory
            </button>
            <button 
                onClick={() => setIsAssistantOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
              AI Assistant
            </button>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
          
          <div className="pt-4 mt-4 border-t border-white/10 text-center">
             <p className="text-[10px] uppercase tracking-wider text-indigo-400 mb-1">App Created by</p>
             <p className="text-sm font-semibold text-indigo-200">Dinesh Kumar</p>
          </div>
        </div>
      </aside>

      {/* --- Mobile Top Header --- */}
      <div className="md:hidden bg-gradient-to-r from-indigo-900 to-purple-900 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg">
                    <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">KhataBook</span>
            </div>
             <div className="flex items-center gap-3">
                <div className="text-right mr-1">
                    <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Balance</p>
                    <p className="text-lg font-bold leading-none">₹{stats.balance.toLocaleString()}</p>
                </div>
                {/* Mobile User Avatar */}
                <button onClick={() => setIsProfileOpen(true)} className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center overflow-hidden">
                    {user.profileImage ? (
                        <img src={user.profileImage} alt="Me" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm font-bold">{user.name.charAt(0)}</span>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen pb-24 md:pb-8">
        {/* Desktop Header / Mobile Subheader */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold text-slate-800">Hello, {user.name} 👋</h1>
            <p className="text-slate-500">
              {activeTab === 'dashboard' ? "Here's your financial overview for today." : "Manage your vehicle inventory."}
            </p>
          </div>
          {/* Mobile Greetings */}
          <div className="md:hidden w-full">
            <p className="text-sm text-slate-500">
              Welcome back, <span className="font-bold text-slate-800">{user.name}</span>
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {activeTab === 'dashboard' && (
                <>
                <Button variant="secondary" onClick={handleExportPDF} className="shadow-sm flex-1 sm:flex-none justify-center">
                    <FileDown className="w-5 h-5 md:mr-2" /> <span className="hidden md:inline">Export PDF</span><span className="md:hidden">Export</span>
                </Button>
                {/* Desktop Add Button */}
                <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-indigo-500/20 hidden md:flex">
                    <Plus className="w-5 h-5 mr-2" /> Add Transaction
                </Button>
                </>
            )}
            {/* Inventory 'Add' button is handled inside Inventory component */}
          </div>
        </header>

        {activeTab === 'dashboard' ? (
            <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-6 mb-8">
                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-emerald-100 rounded-full text-emerald-600">
                            <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                        <p className="text-xs md:text-sm font-semibold text-slate-500">Total Income</p>
                        <p className="text-lg md:text-2xl font-bold text-slate-800 break-all">+ ₹{stats.income.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                        <div className="p-2 md:p-3 bg-rose-100 rounded-full text-rose-600">
                            <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                        <p className="text-xs md:text-sm font-semibold text-slate-500">Total Expense</p>
                        <p className="text-lg md:text-2xl font-bold text-slate-800 break-all">- ₹{stats.expense.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
                    <h3 className="font-bold text-slate-800 mb-6">Expense Structure</h3>
                    {chartData.length > 0 ? (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <p>No expense data yet</p>
                    </div>
                    )}
                </div>

                {/* Transactions List Section */}
                <div className="lg:col-span-2">
                    <TransactionList transactions={transactions} onDelete={handleDelete} />
                </div>
                </div>
            </>
        ) : (
            <Inventory user={user} onUserUpdate={onUserUpdate} />
        )}

        {/* Mobile Creator Footer */}
        <div className="mt-8 text-center md:hidden pb-4">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest">App Created by</p>
             <p className="text-xs font-semibold text-slate-600">Dinesh Kumar</p>
        </div>
      </main>

      {/* --- Mobile Bottom Navigation --- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-end h-16 pb-2">
            <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[10px] font-medium">Home</span>
            </button>
            <button
                onClick={() => setActiveTab('inventory')}
                className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors ${activeTab === 'inventory' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
                <Package className="w-6 h-6" />
                <span className="text-[10px] font-medium">Inventory</span>
            </button>
            
            {/* Center FAB for Add Transaction */}
            <div className="relative -top-5">
                 <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/40 text-white border-4 border-slate-50 active:scale-95 transition-transform"
                >
                    <Plus className="w-7 h-7" />
                </button>
            </div>

            <button
                onClick={() => setIsAssistantOpen(true)}
                className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors text-slate-400`}
            >
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <span className="text-[10px] font-medium">AI Chat</span>
            </button>
             <button
                onClick={onLogout}
                className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors text-slate-400`}
            >
                <LogOut className="w-6 h-6" />
                <span className="text-[10px] font-medium">Logout</span>
            </button>
        </div>
      </div>

      {/* AI Assistant Sidebar (adjust z-index to be above nav) */}
      <SmartAssistant 
        transactions={transactions} 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
      />
      
      {/* Profile Modal */}
      <ProfileModal 
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUserUpdate={onUserUpdate}
      />

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Add Transaction</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4 overflow-y-auto">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setNewTx({ ...newTx, type: 'credit' })}
                  className={`p-3 rounded-xl font-semibold transition-all border text-sm ${
                    newTx.type === 'credit'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-100'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Income (Credit)
                </button>
                <button
                  type="button"
                  onClick={() => setNewTx({ ...newTx, type: 'debit' })}
                  className={`p-3 rounded-xl font-semibold transition-all border text-sm ${
                    newTx.type === 'debit'
                      ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-100'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Expense (Debit)
                </button>
              </div>

              {/* Amount & Description */}
              <Input
                label="Amount (₹)"
                type="number"
                placeholder="0.00"
                value={newTx.amount}
                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                required
              />

              <Input
                label="Description"
                placeholder="e.g., Grocery Shopping"
                value={newTx.description}
                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                required
              />

              {/* Customer Name */}
              <div className="relative">
                <Input
                  label="Customer / Party Name"
                  placeholder="e.g. John Doe (Optional)"
                  value={newTx.customerName}
                  onChange={(e) => setNewTx({ ...newTx, customerName: e.target.value })}
                />
                <div className="absolute right-3 top-9 text-slate-400 pointer-events-none">
                    <Users className="w-4 h-4" />
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Payment Type</label>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { type: 'Cash', icon: Banknote },
                        { type: 'UPI', icon: Smartphone },
                        { type: 'Card', icon: CreditCard },
                        { type: 'Bank', icon: Building2 }
                    ].map((item) => (
                        <button
                            key={item.type}
                            type="button"
                            onClick={() => setNewTx({ ...newTx, paymentType: item.type as any })}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                                newTx.paymentType === item.type 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-200' 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <item.icon className="w-5 h-5 mb-1" />
                            <span className="text-xs font-medium">{item.type}</span>
                        </button>
                    ))}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                 <Input
                    label="Category (Optional)"
                    placeholder="Type or select below (AI will suggest if empty)"
                    value={newTx.category}
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                    className="mb-2"
                  />
                  <div className="flex flex-wrap gap-2 mt-[-10px]">
                      {QUICK_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNewTx({ ...newTx, category: cat })}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                newTx.category === cat 
                                ? 'bg-slate-800 text-white border-slate-800' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {cat}
                          </button>
                      ))}
                  </div>
              </div>

              <Button type="submit" className="w-full mt-4" isLoading={loading}>
                Save Transaction
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};