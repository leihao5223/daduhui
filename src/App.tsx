import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SupportChatProvider } from './context/SupportChatContext';
import SupportChatPanel from './components/support/SupportChatPanel';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import GameLobby from './pages/GameLobby';
import AgentRebatePage from './pages/AgentRebatePage';
import DepositPage from './pages/DepositPage';
import WithdrawPage from './pages/WithdrawPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SettingsPage from './pages/SettingsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import SetFundPasswordPage from './pages/SetFundPasswordPage';
import BindBankCardPage from './pages/BindBankCardPage';
import BetHistoryPage from './pages/BetHistoryPage';
import TransactionsPage from './pages/TransactionsPage';
import NotificationsPage from './pages/NotificationsPage';
import ServicePage from './pages/ServicePage';

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.includes('/admin');

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAdminPage && <Header />}
      <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/game" element={<GameLobby />} />
          <Route path="/game/:gameType" element={<GameLobby />} />
          <Route path="/game/agent-rebate" element={<AgentRebatePage />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/withdraw" element={<WithdrawPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/set-fund-password" element={<SetFundPasswordPage />} />
          <Route path="/bind-bank-card" element={<BindBankCardPage />} />
          <Route path="/bet-history" element={<BetHistoryPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        {!isAdminPage && <SupportChatPanel />}
      </div>
  );
}

function App() {
  return (
    <SupportChatProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </SupportChatProvider>
  );
}

export default App;
