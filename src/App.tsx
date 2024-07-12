import { useState } from 'react';
import './App.css';

import Register from './components/Register';
import UserProfile from './components/UserProfile';

function App() {
  return (
    <>
      <span>bento and friends init</span>
      <UserProfile />
      <Register />
    </>
  );
}

export default App;
