import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LayoutDashboard } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/auth';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/login`, { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success('Logged in successfully!');
        window.location.href = '/';
      } else {
        const res = await axios.post(`${API_URL}/register`, { email, password, username });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success('Registered successfully!');
        window.location.href = '/';
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background p-4">
      <div className="bg-surface p-8 rounded-2xl w-full max-w-md border border-white/5 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/20 p-3 rounded-xl text-primary mb-4">
            <LayoutDashboard size={32} />
          </div>
          <h2 className="text-2xl font-bold text-textMain">Welcome to Kinetic</h2>
          <p className="text-textMuted mt-2 text-sm">
            {isLogin ? 'Sign in to access your boards' : 'Create an account to get started'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-textMuted mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surfaceHighlight text-textMain rounded-lg px-4 py-2 border border-white/5 focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surfaceHighlight text-textMain rounded-lg px-4 py-2 border border-white/5 focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surfaceHighlight text-textMain rounded-lg px-4 py-2 border border-white/5 focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-primaryHover text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-textMuted">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primaryHover font-medium"
          >
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
