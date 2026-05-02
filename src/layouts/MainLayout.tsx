import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomTabBar from '../components/BottomTabBar';
import { HomeShellProvider } from '../context/HomeShellContext';

const MainLayout: React.FC = () => {
  return (
    <HomeShellProvider>
      <div className="app-container">
        <Header />
        <main className="main-content main-with-bottom-tab">
          <Outlet />
        </main>
        <Footer />
        <BottomTabBar />
      </div>
    </HomeShellProvider>
  );
};

export default MainLayout;
