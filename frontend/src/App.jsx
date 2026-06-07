import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Board from './components/Board';
import Auth from './components/Auth';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A2235',
            color: '#F8FAFC',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
