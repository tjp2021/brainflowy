import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  const location = useLocation();
  const showHeader = !location.pathname.startsWith('/outlines');

  return (
    <div className="app-layout flex flex-col h-screen">
      {showHeader && <Header />}
      <main className="main-content flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;