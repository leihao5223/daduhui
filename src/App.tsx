import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppShell } from './routes/AppRoutes';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
};

export default App;
