import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { NotificationProvider } from './components/Context/NotificationContext.jsx';
import { UserProvider } from './components/Context/UserContext.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <NotificationProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </NotificationProvider>
  </BrowserRouter>,
);
