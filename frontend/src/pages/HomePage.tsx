import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/useAppStore';


const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isLoading = useAppStore(state => state.isLoading);

  if (isLoading) {
    return (
      <div className="home-page">
        <div className="loading-state">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="home-page">
        <h1>Welcome back, {user.name}!</h1>
        <p>Ready to organize your thoughts and ideas?</p>
        
        <div className="dashboard-actions" style={{ marginTop: '2rem' }}>
          <Link to="/outlines" className="btn-primary" style={{ 
            display: 'inline-block', 
            padding: '12px 24px', 
            textDecoration: 'none',
            marginRight: '1rem'
          }}>
            View Your Outlines
          </Link>
          
          <button 
            className="btn-secondary" 
            style={{ padding: '12px 24px' }}
            onClick={() => {
              // TODO: Add create new outline functionality
              console.log('Create new outline clicked');
            }}
          >
            Create New Outline
          </button>
        </div>
        
        <div className="user-stats" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Your Account</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <h1>Welcome to BrainFlowy</h1>
      <p>Your intelligent mind-mapping and outlining companion</p>

      
      <div className="auth-actions" style={{ marginTop: '2rem' }}>
        <Link to="/login" className="btn-primary" style={{ 
          display: 'inline-block', 
          padding: '12px 24px', 
          textDecoration: 'none',
          marginRight: '1rem'
        }}>
          Sign In
        </Link>
        
        <Link to="/register" className="btn-secondary" style={{ 
          display: 'inline-block', 
          padding: '12px 24px', 
          textDecoration: 'none'
        }}>
          Sign Up
        </Link>
      </div>
      
      <div className="features" style={{ marginTop: '3rem' }}>
        <h2>Why BrainFlowy?</h2>
        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="feature-card" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>🧠 Smart Organization</h3>
            <p>Organize your thoughts with intelligent mind maps and structured outlines.</p>
          </div>
          <div className="feature-card" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>📱 PWA Ready</h3>
            <p>Works offline and can be installed on your device for quick access.</p>
          </div>
          <div className="feature-card" style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>🔄 Real-time Sync</h3>
            <p>Your ideas sync across all your devices automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;