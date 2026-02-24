import React, { createContext, useContext, ReactNode, useReducer } from 'react';
import { initialState } from '../../store/state';
import appReducer from '@store/appReducer';

// Define the shape of the global state
interface GlobalState {
  [key: string]: any;
}

// Define the shape of the context value
interface GlobalContextType {
  // eslint-disable-next-line no-unused-vars
  setGlobalState: (type: string, value: any) => void;
  globaleState: GlobalState;
}

// Create a Context for the global state
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Create a provider component
export const GlobalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setGlobalState = (type: string, value: any): void => {
    if (dispatch) {
      try {
        dispatch({ type: type, payload: value });
      } catch (error) {
        console.error('Error setting global state', error);
      }
    }
  };

  return (
    <GlobalContext.Provider value={{ globaleState: state, setGlobalState }}>
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook to use the global state
export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};
