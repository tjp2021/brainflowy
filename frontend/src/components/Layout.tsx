import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  const location = useLocation();
  const showHeader = !location.pathname.startsWith('/outlines');
  const isOutlinePage = location.pathname.startsWith('/outlines');
  const isHomePage = location.pathname === '/';

  // For home page, don't apply main-content class to avoid CSS conflicts
  if (isHomePage) {
    return (
      <div className="flex flex-col min-h-screen">
        {showHeader && <Header />}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  // For outline page, use fixed height container to prevent body scroll
  if (isOutlinePage) {
    return (
      <div className="h-screen overflow-hidden">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="app-layout flex flex-col min-h-screen">
      {showHeader && <Header />}
      <main className="main-content flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;