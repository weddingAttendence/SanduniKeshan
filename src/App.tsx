import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { AttendanceForm } from './components/AttendanceForm';
import { SuccessMessage } from './components/SuccessMessage';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';

function App() {
  const [currentView, setCurrentView] = useState<'form' | 'success' | 'admin-login' | 'admin'>('form');

  const handleFormSuccess = () => {
    setCurrentView('success');
  };

  const handleBackToForm = () => {
    setCurrentView('form');
  };

  const handleAdminLogin = () => {
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    setCurrentView('form');
  };

  const showAdminLogin = () => {
    setCurrentView('admin-login');
  };

  if (currentView === 'admin-login') {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  if (currentView === 'admin') {
    return <AdminPanel onLogout={handleAdminLogout} />;
  }

  if (currentView === 'form') {
    return (
      <>
        <AttendanceForm onSuccess={handleFormSuccess} />
        <button
          onClick={showAdminLogin}
          className="fixed bottom-6 right-6 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Admin Access"
        >
          <Shield className="w-5 h-5" />
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100">
      <div className="max-w-4xl mx-auto px-4 pb-16 pt-16">
        {currentView === 'success' && (
          <SuccessMessage onBackToForm={handleBackToForm} />
        )}
      </div>

      <button
        onClick={showAdminLogin}
        className="fixed bottom-6 right-6 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Admin Access"
      >
        <Shield className="w-5 h-5" />
      </button>
    </div>
  );
}

export default App;