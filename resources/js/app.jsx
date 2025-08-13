import React from 'react';
import ReactDOM from 'react-dom/client';
import '../css/app.css';

const App = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold text-gray-800">Astole CMS</h1>
                <p className="text-gray-600 mt-2">Welcome to your CMS</p>
            </div>
        </div>
    );
};

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
