import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, User, MenuItem, Order } from '../types';
import { getCurrentUser } from '../services/auth';

// Define action types
type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_MENU_ITEMS'; payload: MenuItem[] }
  | { type: 'SET_CURRENT_ORDER'; payload: Order | null }
  | { type: 'ADD_TO_ORDER'; payload: MenuItem }
  | { type: 'REMOVE_FROM_ORDER'; payload: string }  // MenuItem id
  | { type: 'CLEAR_ORDER' }
  | { type: 'SIGN_OUT' }
  ;

// Initial state
const initialState: AppState = {
  user: null,
  menuItems: [],
  currentOrder: null,
};

// Create the context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

// Reducer function
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SIGN_OUT':
      return { ...state, user: null, currentOrder: null };
    case 'SET_MENU_ITEMS':
      return { ...state, menuItems: action.payload };
    case 'SET_CURRENT_ORDER':
      return { ...state, currentOrder: action.payload };
    case 'ADD_TO_ORDER':
      if (!state.currentOrder) {
        return {
          ...state,
          currentOrder: {
            userId: state.user?.id || '',
            items: [action.payload],
            total: action.payload.price,
            status: 'pending'
          }
        };
      }
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: [...state.currentOrder.items, action.payload],
          total: state.currentOrder.total + action.payload.price
        }
      };
    case 'REMOVE_FROM_ORDER':
      if (!state.currentOrder) return state;
      const itemToRemove = state.currentOrder.items.find(item => item.id === action.payload);
      if (!itemToRemove) return state;
      return {
        ...state,
        currentOrder: {
          ...state.currentOrder,
          items: state.currentOrder.items.filter(item => item.id !== action.payload),
          total: state.currentOrder.total - itemToRemove.price
        }
      };
    case 'CLEAR_ORDER':
      return { ...state, currentOrder: null };
    default:
      return state;
  }
};

// Context provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
  
    useEffect(() => {
      const loadUser = async () => {
        const user = await getCurrentUser();
        dispatch({ type: 'SET_USER', payload: user });
      };
      loadUser();
    }, []);
  
    return (
      <AppContext.Provider value={{ state, dispatch }}>
        {children}
      </AppContext.Provider>
    );
};

// Custom hook to use the AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};