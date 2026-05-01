import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomTabBar from '../components/BottomTabBar';

const MainLayout: React.FC = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content main-with-bottom-tab">
        <Outlet />
      </main>
      <Footer />
      <BottomTabBar />
    </div>
  );
};

export default MainLayout;
