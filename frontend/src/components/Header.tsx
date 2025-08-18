import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <nav className="nav-container">
        <Link to="/" className="logo">
          <h1>BrainFlowy</h1>
        </Link>
        
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <Link to="/outlines" className="nav-link">
                My Outlines
              </Link>
              <button 
                onClick={handleLogout}
                className="nav-link btn-logout"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Sign In
              </Link>
              <Link to="/register" className="nav-link btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="mobile-menu-btn"
          aria-label="Toggle menu"
          onClick={() => console.log('Toggle mobile menu')}
        >
          <span className="hamburger"></span>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
        </button>
      </nav>
    </header>
  );
};

export default Header;