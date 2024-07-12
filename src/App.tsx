import { useState } from 'react';
import './App.css';
import { AppProvider } from './context/AppContext';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';

const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="App">
        <SignIn />
        <SignUp />
      </div>
    </AppProvider>
  );
}

export default App;
