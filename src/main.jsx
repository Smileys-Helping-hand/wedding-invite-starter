import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';
import { FirebaseProvider } from './providers/FirebaseProvider.jsx';
import { GuestProvider } from './providers/GuestProvider.jsx';
import { AudioProvider } from './providers/AudioProvider.jsx';
import { ThemeProvider } from './providers/ThemeProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FirebaseProvider>
      <ThemeProvider>
        <GuestProvider>
          <AudioProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AudioProvider>
        </GuestProvider>
      </ThemeProvider>
    </FirebaseProvider>
  </React.StrictMode>
);
