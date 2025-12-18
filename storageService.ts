import { User, Transaction, InventoryItem } from '../types';

const USERS_KEY = 'smart_khata_users';
const TRANSACTIONS_KEY = 'smart_khata_transactions';
const INVENTORY_KEY = 'smart_khata_inventory';
const CURRENT_USER_KEY = 'smart_khata_current_user';

export const StorageService = {
  getUsers: (): User[] => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  },

  saveUser: (user: User): void => {
    const users = StorageService.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: (updatedUser: User): void => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Update current session if it matches
      const currentUser = StorageService.getCurrentUser();
      if (currentUser && currentUser.id === updatedUser.id) {
         localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }
    }
  },

  findUser: (emailOrMobile: string): User | undefined => {
    const users = StorageService.getUsers();
    return users.find(u => u.emailOrMobile === emailOrMobile);
  },

  login: (user: User): void => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  logout: (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Transactions
  getTransactions: (userId: string): Transaction[] => {
    const allTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const parsed: Record<string, Transaction[]> = allTransactions ? JSON.parse(allTransactions) : {};
    return parsed[userId] || [];
  },

  saveTransaction: (userId: string, transaction: Transaction): void => {
    const allTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const parsed: Record<string, Transaction[]> = allTransactions ? JSON.parse(allTransactions) : {};
    
    if (!parsed[userId]) {
      parsed[userId] = [];
    }
    
    parsed[userId] = [transaction, ...parsed[userId]]; // Add to top
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(parsed));
  },

  deleteTransaction: (userId: string, transactionId: string): void => {
    const allTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const parsed: Record<string, Transaction[]> = allTransactions ? JSON.parse(allTransactions) : {};
    
    if (parsed[userId]) {
      parsed[userId] = parsed[userId].filter(t => t.id !== transactionId);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(parsed));
    }
  },

  // Inventory
  getInventory: (userId: string): InventoryItem[] => {
    const allInventory = localStorage.getItem(INVENTORY_KEY);
    const parsed: Record<string, InventoryItem[]> = allInventory ? JSON.parse(allInventory) : {};
    return parsed[userId] || [];
  },

  saveInventoryItem: (userId: string, item: InventoryItem): void => {
    const allInventory = localStorage.getItem(INVENTORY_KEY);
    const parsed: Record<string, InventoryItem[]> = allInventory ? JSON.parse(allInventory) : {};
    
    if (!parsed[userId]) {
      parsed[userId] = [];
    }
    
    parsed[userId] = [item, ...parsed[userId]];
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(parsed));
  },

  updateInventoryItem: (userId: string, updatedItem: InventoryItem): void => {
    const allInventory = localStorage.getItem(INVENTORY_KEY);
    const parsed: Record<string, InventoryItem[]> = allInventory ? JSON.parse(allInventory) : {};
    
    if (parsed[userId]) {
      parsed[userId] = parsed[userId].map(item => item.id === updatedItem.id ? updatedItem : item);
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(parsed));
    }
  },

  deleteInventoryItem: (userId: string, itemId: string): void => {
    const allInventory = localStorage.getItem(INVENTORY_KEY);
    const parsed: Record<string, InventoryItem[]> = allInventory ? JSON.parse(allInventory) : {};
    
    if (parsed[userId]) {
      parsed[userId] = parsed[userId].filter(i => i.id !== itemId);
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(parsed));
    }
  }
};