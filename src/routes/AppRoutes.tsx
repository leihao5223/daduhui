import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { SupportChatProvider } from '../context/SupportChatContext';
import { SupportChatPanel } from '../components/support/SupportChatPanel';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import PlaceholderPage from '../pages/PlaceholderPage';
import DepositPage from '../pages/DepositPage';
import WithdrawPage from '../pages/WithdrawPage';
import ProfilePage from '../pages/ProfilePage';
import AgentCenterPage from '../pages/AgentCenterPage';
import AssetRecordsPage from '../pages/AssetRecordsPage';
import { AdminLoginPage, AdminConsolePage, AdminSupportPage } from '../pages/admin';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import GameSlugRouter from '../pages/games/GameSlugRouter';

const AuthAwareSupportChat: React.FC = () => {
  const location = useLocation();
  const hide =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/game');
  if (hide) return null;
  return <SupportChatPanel />;
};

export const AppRoutes: React.FC = () => {
  useTheme();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/support" element={<AdminSupportPage />} />
        <Route path="/admin/console" element={<AdminConsolePage />} />
        <Route path="/admin/users" element={<AdminConsolePage />} />
        <Route path="/admin/finance" element={<AdminConsolePage />} />
        <Route path="/admin/agents" element={<AdminConsolePage />} />
        <Route path="/admin/user-relations" element={<Navigate to="/admin/users" replace />} />

        <Route path="/game/:slug" element={<GameSlugRouter />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="recharge" element={<Navigate to="/deposit" replace />} />
          <Route path="withdraw" element={<WithdrawPage />} />
          <Route path="sports" element={<PlaceholderPage pageKey="sports" />} />
          <Route path="lottery" element={<Navigate to="/agent" replace />} />
          <Route path="activity" element={<PlaceholderPage pageKey="activity" />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="wallet/records" element={<AssetRecordsPage />} />
          <Route path="agent" element={<AgentCenterPage />} />
          <Route path="support" element={<PlaceholderPage pageKey="support" />} />
          <Route path="forgot-password" element={<PlaceholderPage pageKey="forgotPassword" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <AuthAwareSupportChat />
    </>
  );
};

export const AppShell: React.FC = () => {
  return (
    <SupportChatProvider>
      <AppRoutes />
    </SupportChatProvider>
  );
};
