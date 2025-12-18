export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit'; // credit = income, debit = expense
  description: string;
  category: string;
  paymentType: 'Cash' | 'UPI' | 'Card' | 'Bank' | 'Other';
  customerName?: string;
  date: string; // ISO string
}

export interface InventoryItem {
  id: string;
  serialNo?: string;
  frameNo: string;
  engineNo: string;
  model: string;
  variant: string;
  colour: string;
  category?: string; // e.g. Scooter, Bike, Car
  status: 'Available' | 'Booked' | 'Sold' | 'Service';
  dateAdded: string;
}

export interface User {
  id: string;
  name: string;
  emailOrMobile: string;
  password: string;
  companyName?: string;
  address?: string;
  profileImage?: string; // Base64 data URL
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}