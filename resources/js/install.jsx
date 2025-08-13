// resources/js/install.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import InstallWizard from './components/install/InstallWizard';
// Make sure CSS is imported!
import '../css/app.css';

// Add this to check if React is mounting
console.log('Install script loaded');

const rootElement = document.getElementById('install-root');
if (rootElement) {
    console.log('Mounting React app...');
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <InstallWizard />
        </React.StrictMode>
    );
} else {
    console.error('Could not find install-root element');
}
