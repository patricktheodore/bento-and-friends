import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { signIn } from '../services/auth';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { dispatch } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await signIn(email, password);
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      console.error('Error signing in:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
<div className="bg-brand-dark-green text-brand-cream">
  <h1 className="text-brand-gold">Welcome to Bento&Friends</h1>
  <p className="text-brand-taupe">Delicious and healthy meals for students</p>
</div>

<h1 className="font-bold">Bold Heading</h1>
<p className="font-normal">Normal text</p>
<span className="font-light">Light text</span>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign In</button>
    </form>
  );
};

export default SignIn;