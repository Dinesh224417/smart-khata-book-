import React, { useState, useEffect } from 'react';
import { InventoryItem, User } from '../types';
import { StorageService } from '../services/storageService';
import { Button } from './Button';
import { Input } from './Input';
import { Plus, Search, Trash2, CarFront, Hash, Activity, PaintBucket, Tag, X, CheckCircle2, FileDown, ClipboardList, Pencil, Settings, Bike, Car, Truck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InventoryProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const VEHICLE_CATEGORIES = ['Scooter', 'Bike', 'Car', 'Auto', 'EV', 'Truck', 'Other'];

export const Inventory: React.FC<InventoryProps> = ({ user, onUserUpdate }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Inventory Form
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id' | 'dateAdded'>>({
    serialNo: '',
    frameNo: '',
    engineNo: '',
    model: '',
    variant: '',
    colour: '',
    category: '',
    status: 'Available'
  });

  // Settings Form
  const [settingsForm, setSettingsForm] = useState({
      companyName: '',
      address: ''
  });

  useEffect(() => {
    setItems(StorageService.getInventory(user.id));
    setSettingsForm({
        companyName: user.companyName || '',
        address: user.address || ''
    });
  }, [user.id, user.companyName, user.address]);

  const resetForm = () => {
    setNewItem({ serialNo: '', frameNo: '', engineNo: '', model: '', variant: '', colour: '', category: '', status: 'Available' });
    setEditingId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setNewItem({
      serialNo: item.serialNo || '',
      frameNo: item.frameNo,
      engineNo: item.engineNo,
      model: item.model,
      variant: item.variant,
      colour: item.colour,
      category: item.category || '',
      status: item.status
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.frameNo || !newItem.model) return;

    if (editingId) {
      // Update existing item
      const existingItem = items.find(i => i.id === editingId);
      const updatedItem: InventoryItem = {
        id: editingId,
        dateAdded: existingItem?.dateAdded || new Date().toISOString(),
        ...newItem
      };
      StorageService.updateInventoryItem(user.id, updatedItem);
    } else {
      // Add new item
      const item: InventoryItem = {
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString(),
        ...newItem
      };
      StorageService.saveInventoryItem(user.id, item);
    }

    setItems(StorageService.getInventory(user.id));
    resetForm();
    setIsModalOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      const updatedUser = {
          ...user,
          companyName: settingsForm.companyName,
          address: settingsForm.address
      };
      StorageService.updateUser(updatedUser);
      onUserUpdate(updatedUser);
      setIsSettingsOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this inventory item?')) {
      StorageService.deleteInventoryItem(user.id, id);
      setItems(StorageService.getInventory(user.id));
    }
  };

  const filteredItems = items.filter(item => 
    item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.frameNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.variant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.serialNo && item.serialNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: items.length,
    available: items.filter(i => i.status === 'Available').length,
    sold: items.filter(i => i.status === 'Sold').length,
    booked: items.filter(i => i.status === 'Booked').length
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header Configuration ---
    const companyName = user.companyName || "Smart Khata Book";
    // Wrap address text to 100 units width
    const addressLines = user.address ? doc.splitTextToSize(user.address, 100) : [];
    
    // Calculate header height dynamically based on address lines (min 40)
    const baseHeaderHeight = 40;
    const addressBlockHeight = addressLines.length > 0 ? (addressLines.length * 5) : 0;
    const headerHeight = Math.max(baseHeaderHeight, 30 + addressBlockHeight + 10);

    // Draw Header Background
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    
    // 1. Company Name
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(companyName, 14, 20);
    
    // 2. Address (Multiline)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (addressLines.length > 0) {
        doc.text(addressLines, 14, 28);
    } else if (!user.companyName) {
        doc.text("Inventory Management System", 14, 28);
    }
    
    // 3. Document Title (Right Aligned)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INVENTORY REPORT", pageWidth - 14, 20, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 28, { align: "right" });

    // --- Body Content ---
    const contentStartY = headerHeight + 15;
    
    // User Info Label
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated by: ${user.name}`, 14, contentStartY);

    // Summary Box
    const boxY = contentStartY + 5;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, boxY, 180, 25, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.text("Total Stock", 20, boxY + 8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(`${stats.total}`, 20, boxY + 18);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0,0,0);
    doc.setFontSize(10);
    doc.text("Available", 80, boxY + 8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74); // Green
    doc.text(`${stats.available}`, 80, boxY + 18);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0,0,0);
    doc.setFontSize(10);
    doc.text("Sold / Booked", 140, boxY + 8);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`${stats.sold + stats.booked}`, 140, boxY + 18);

    // Table Data
    const dataToExport = filteredItems.length > 0 ? filteredItems : items;

    const tableData = dataToExport.map(item => [
        item.serialNo || '-',
        item.category ? `[${item.category}] ${item.model}` : item.model,
        item.variant,
        item.frameNo,
        item.engineNo || '-',
        item.colour,
        item.status,
        new Date(item.dateAdded).toLocaleDateString()
    ]);

    autoTable(doc, {
        startY: boxY + 35,
        head: [['Serial No', 'Model', 'Variant', 'Frame No', 'Engine No', 'Colour', 'Status', 'Date Added']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
    });

    doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getCategoryIcon = (category?: string) => {
    switch(category) {
        case 'Car': return <Car className="w-4 h-4" />;
        case 'Truck': return <Truck className="w-4 h-4" />;
        default: return <Bike className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Model, Frame, Variant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" onClick={handleExportPDF} className="flex-1 md:flex-none justify-center">
             <FileDown className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Download PDF</span>
          </Button>
          <Button variant="secondary" onClick={() => setIsSettingsOpen(true)} className="flex-1 md:flex-none justify-center" title="Invoice Settings">
             <Settings className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Settings</span>
          </Button>
          <Button onClick={handleOpenAddModal} className="shadow-lg shadow-indigo-500/20 flex-1 md:flex-none justify-center">
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20">
          <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Stock</p>
          <p className="text-2xl md:text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">Available</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-800">{stats.available}</p>
        </div>
        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
          <p className="text-orange-600 text-xs font-semibold uppercase tracking-wider mb-1">Sold/Booked</p>
          <p className="text-2xl md:text-3xl font-bold text-slate-800">{stats.sold + stats.booked}</p>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4 rounded-tl-2xl">Vehicle Details</th>
                <th className="p-4">Identifiers</th>
                <th className="p-4">Specs</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-tr-2xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No vehicles found. Add one to get started.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                           {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                              {item.category && <span className="inline-block text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 mr-1.5 align-middle">{item.category}</span>}
                              {item.model}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {item.variant}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-slate-400" /> Frame: {item.frameNo}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-slate-400" /> Eng: {item.engineNo}
                        </p>
                        {item.serialNo && (
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <ClipboardList className="w-3 h-3 text-slate-400" /> S.No: {item.serialNo}
                            </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <PaintBucket className="w-4 h-4 text-slate-400" />
                        {item.colour}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        item.status === 'Sold' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        item.status === 'Booked' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Category Selection */}
                <div className="md:col-span-2 mb-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Category (Optional)</label>
                    <div className="flex flex-wrap gap-2">
                        {VEHICLE_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setNewItem({...newItem, category: cat})}
                                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                                    newItem.category === cat 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <Input
                        label="Model Name"
                        placeholder="e.g. Activa 6G, Splendor+"
                        value={newItem.model}
                        onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                        required
                    />
                </div>

                <Input
                  label="Variant"
                  placeholder="e.g. Drum, Disc, Alloy"
                  value={newItem.variant}
                  onChange={(e) => setNewItem({ ...newItem, variant: e.target.value })}
                />

                <Input
                  label="Colour"
                  placeholder="e.g. Matte Black"
                  value={newItem.colour}
                  onChange={(e) => setNewItem({ ...newItem, colour: e.target.value })}
                />

                <Input
                  label="Frame / Chassis No"
                  placeholder="Last 5-6 digits"
                  value={newItem.frameNo}
                  onChange={(e) => setNewItem({ ...newItem, frameNo: e.target.value })}
                  required
                />

                <Input
                  label="Engine No"
                  placeholder="Last 5-6 digits"
                  value={newItem.engineNo}
                  onChange={(e) => setNewItem({ ...newItem, engineNo: e.target.value })}
                />
                
                <Input
                  label="Serial No (Optional)"
                  placeholder="Internal Serial / Stock No"
                  value={newItem.serialNo}
                  onChange={(e) => setNewItem({ ...newItem, serialNo: e.target.value })}
                />

                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Current Status</label>
                    <div className="grid grid-cols-4 gap-3">
                        {['Available', 'Booked', 'Sold', 'Service'].map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setNewItem({ ...newItem, status: status as any })}
                                className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                                    newItem.status === status
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                 <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                 <Button type="submit" className="px-8 shadow-indigo-200">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Save Vehicle
                 </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Invoice Settings
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                <p className="text-sm text-slate-500 mb-4">
                    These details will appear on your exported PDF reports (Invoices/Stock Lists).
                </p>

                <Input 
                    label="Company / Shop Name"
                    placeholder="e.g. Dinesh Motors"
                    value={settingsForm.companyName}
                    onChange={(e) => setSettingsForm({...settingsForm, companyName: e.target.value})}
                />

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">Shop Address</label>
                    <textarea
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 min-h-[100px] resize-none"
                        placeholder="Enter full address..."
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({...settingsForm, address: e.target.value})}
                    />
                </div>

                <Button type="submit" className="w-full mt-2">Save Settings</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};