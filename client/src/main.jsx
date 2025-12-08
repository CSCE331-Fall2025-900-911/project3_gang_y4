import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import {TranslationProvider} from  './context/TranslationContext';

import { LANDING_STRINGS } from './strings/LandingStrings';
import { KIOSK_STRINGS } from './strings/KioskStrings';
import { STAFF_STRINGS } from './strings/StaffStrings';

const availableStringFiles = {
  landing: LANDING_STRINGS,
  kiosk: KIOSK_STRINGS,
  staff: STAFF_STRINGS
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TranslationProvider availableStringFiles={availableStringFiles}>
      <App />
    </TranslationProvider>
  </React.StrictMode>
);
