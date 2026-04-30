import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  isLoggedIn?: boolean;
  userId?: string;
  balance?: number;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn = false, userId = '', balance = 0 }) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between bg-white border-b border-gray-100">
      <div className="flex items-center gap-2" onClick={() => navigate('/home')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          6G
        </div>
        <span className="text-gray-900 font-bold text-lg">6G.COM</span>
      </div>
      
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-600 text-sm">ID: {userId}</span>
            <span className="text-blue-600 font-bold text-sm">¥{balance.toFixed(2)}</span>
          </div>
        ) : (
          <>
            <button className="px-4 py-1.5 rounded-full text-blue-600 text-sm font-medium border border-blue-500 hover:bg-blue-50">
              登录
            </button>
            <button className="px-4 py-1.5 rounded-full text-white text-sm font-medium bg-blue-500 hover:bg-blue-600">
              注册
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
