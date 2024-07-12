export interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'main' | 'fruit' | 'yogurt';
}

export interface Order {
  id?: string;
  userId: string;
  items: MenuItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface AppState {
  user: User | null;
  menuItems: MenuItem[];
  currentOrder: Order | null;
}