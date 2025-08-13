// resources/js/components/install/InstallWizard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

const InstallWizard = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [requirements, setRequirements] = useState(null);
    const [requirementsPassed, setRequirementsPassed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dbTestPassed, setDbTestPassed] = useState(false);
    
    const [formData, setFormData] = useState({
        db_host: 'localhost',
        db_port: '3306',
        db_database: '',
        db_username: '',
        db_password: '',
        admin_name: '',
        admin_email: '',
        admin_username: '',
        admin_password: '',
        admin_password_confirmation: '',
        site_name: 'Astole CMS',
        site_url: window.location.origin,
        site_description: '',
    });

    useEffect(() => {
        // Only check requirements on step 1
        if (currentStep === 1 && !requirements) {
            checkRequirements();
        }
    }, [currentStep, requirements]);

    const checkRequirements = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/install/check-requirements');
            setRequirements(response.data.requirements);
            setRequirementsPassed(response.data.passed);
        } catch (error) {
            console.error('Requirements check failed:', error);
            setError('Failed to check requirements: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const testDatabase = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post('/install/test-database', {
                db_host: formData.db_host,
                db_port: formData.db_port,
                db_database: formData.db_database,
                db_username: formData.db_username,
                db_password: formData.db_password,
            });
            
            if (response.data.success) {
                setDbTestPassed(true);
                setTimeout(() => setCurrentStep(3), 1000);
            }
        } catch (error) {
            console.error('Database test failed:', error);
            setError(error.response?.data?.message || 'Database connection failed');
            setDbTestPassed(false);
        } finally {
            setLoading(false);
        }
    };

    const runInstallation = async () => {
        setLoading(true);
        setError(null);
        
        // Validate passwords match
        if (formData.admin_password !== formData.admin_password_confirmation) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate all required fields
        const requiredFields = [
            'db_host', 'db_port', 'db_database', 'db_username',
            'admin_name', 'admin_email', 'admin_username', 'admin_password',
            'site_name', 'site_url'
        ];

        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
            setError(`Missing required fields: ${missingFields.join(', ')}`);
            setLoading(false);
            return;
        }
        
        try {
            console.log('Sending installation data:', formData);
            const response = await axios.post('/install/run', formData);
            
            if (response.data.success) {
                setCurrentStep(5);
                setTimeout(() => {
                    window.location.href = response.data.redirect || '/';
                }, 3000);
            }
        } catch (error) {
            console.error('Installation failed:', error);
            const errorMessage = error.response?.data?.message || 'Installation failed';
            const errors = error.response?.data?.errors;
            
            if (errors) {
                const errorList = Object.entries(errors).map(([field, messages]) => 
                    `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
                ).join('\n');
                setError(errorMessage + '\n' + errorList);
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const goToStep = (step) => {
        // Validate before moving forward
        if (step > currentStep) {
            if (currentStep === 1 && !requirementsPassed) {
                setError('Please ensure all requirements are met');
                return;
            }
            if (currentStep === 2 && !dbTestPassed) {
                setError('Please test database connection first');
                return;
            }
        }
        setError(null);
        setCurrentStep(step);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                System Requirements
                            </h2>
                            <p className="text-gray-400 mt-2">
                                Checking if your server meets the requirements
                            </p>
                        </div>
                        
                        {loading && (
                            <div className="text-center text-gray-300">
                                Checking requirements...
                            </div>
                        )}
                        
                        {requirements && (
                            <div className="bg-gray-800/50 rounded-lg p-6 space-y-3">
                                {Object.entries(requirements).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <span className="text-gray-300">
                                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            value 
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                            {value ? '✓ Passed' : '✗ Failed'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                                {error}
                            </div>
                        )}
                        
                        <div className="flex justify-end">
                            <button
                                onClick={() => goToStep(2)}
                                disabled={!requirementsPassed || loading}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                    requirementsPassed && !loading
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Next: Database Configuration
                            </button>
                        </div>
                    </div>
                );
                
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                Database Configuration
                            </h2>
                            <p className="text-gray-400 mt-2">
                                Configure your MariaDB/MySQL connection
                            </p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Database Host
                                    </label>
                                    <input
                                        type="text"
                                        name="db_host"
                                        value={formData.db_host}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                        placeholder="localhost"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Port
                                    </label>
                                    <input
                                        type="text"
                                        name="db_port"
                                        value={formData.db_port}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                        placeholder="3306"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Database Name
                                </label>
                                <input
                                    type="text"
                                    name="db_database"
                                    value={formData.db_database}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                    placeholder="astole_cms"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Database Username
                                </label>
                                <input
                                    type="text"
                                    name="db_username"
                                    value={formData.db_username}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                    placeholder="db_user"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Database Password
                                </label>
                                <input
                                    type="password"
                                    name="db_password"
                                    value={formData.db_password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                                {error}
                            </div>
                        )}
                        
                        {dbTestPassed && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400">
                                ✓ Database connection successful!
                            </div>
                        )}
                        
                        <div className="flex justify-between">
                            <button
                                onClick={() => goToStep(1)}
                                className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={testDatabase}
                                disabled={loading || !formData.db_database || !formData.db_username}
                                className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Testing...' : 'Test Connection & Continue'}
                            </button>
                        </div>
                    </div>
                );
                
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                Administrator Account
                            </h2>
                            <p className="text-gray-400 mt-2">
                                Create your admin account to manage the CMS
                            </p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="admin_name"
                                    value={formData.admin_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="admin_email"
                                    value={formData.admin_email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                    placeholder="admin@astole.me"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="admin_username"
                                    value={formData.admin_username}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="admin_password"
                                        value={formData.admin_password}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                        placeholder="••••••••"
                                        required
                                        minLength="8"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        name="admin_password_confirmation"
                                        value={formData.admin_password_confirmation}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                        placeholder="••••••••"
                                        required
                                        minLength="8"
                                    />
                                </div>
                            </div>
                            
                            {formData.admin_password && formData.admin_password_confirmation && 
                             formData.admin_password !== formData.admin_password_confirmation && (
                                <p className="text-red-400 text-sm">Passwords do not match</p>
                            )}
                        </div>
                        
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                                {error}
                            </div>
                        )}
                        
                        <div className="flex justify-between">
                            <button
                                onClick={() => goToStep(2)}
                                className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => goToStep(4)}
                                disabled={!formData.admin_name || !formData.admin_email || !formData.admin_username || 
                                         !formData.admin_password || formData.admin_password !== formData.admin_password_confirmation}
                                className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next: Site Settings
                            </button>
                        </div>
                    </div>
                );
                
            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                Site Configuration
                            </h2>
                            <p className="text-gray-400 mt-2">
                                Configure your website settings
                            </p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Site Name
                                </label>
                                <input
                                    type="text"
                                    name="site_name"
                                    value={formData.site_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                    placeholder="My Website"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Site URL
                                </label>
                                <input
                                    type="url"
                                    name="site_url"
                                    value={formData.site_url}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                    placeholder="https://astole.me"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Site Description (Optional)
                                </label>
                                <textarea
                                    name="site_description"
                                    value={formData.site_description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                                    placeholder="A brief description of your website..."
                                />
                            </div>
                        </div>
                        
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 whitespace-pre-wrap">
                                {error}
                            </div>
                        )}
                        
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                            <p className="text-amber-400 font-semibold mb-2">⚠ Ready to Install</p>
                            <p className="text-amber-300 text-sm">
                                Please review your settings. The installation will create database tables, 
                                set up your admin account, and configure the CMS.
                            </p>
                            <div className="mt-3 text-sm text-gray-400">
                                <p>Database: {formData.db_database}@{formData.db_host}</p>
                                <p>Admin: {formData.admin_username} ({formData.admin_email})</p>
                                <p>Site: {formData.site_name}</p>
                            </div>
                        </div>
                        
                        <div className="flex justify-between">
                            <button
                                onClick={() => goToStep(3)}
                                className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={runInstallation}
                                disabled={loading}
                                className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Installing...' : 'Run Installation'}
                            </button>
                        </div>
                    </div>
                );
                
            case 5:
                return (
                    <div className="text-center space-y-6">
                        <div className="mb-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                                Installation Complete!
                            </h2>
                            <p className="text-gray-400 mt-2">
                                Your CMS has been successfully installed
                            </p>
                        </div>
                        
                        <div className="bg-gray-800/50 rounded-lg p-6">
                            <p className="text-gray-300 mb-4">
                                Redirecting to your site in 3 seconds...
                            </p>
                            <div className="flex justify-center space-x-2">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                        </div>
                    </div>
                );
                
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-8">
            <div className="max-w-3xl w-full">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div
                                key={step}
                                className={`flex items-center ${step < 5 ? 'flex-1' : ''}`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all cursor-pointer ${
                                        currentStep >= step
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                            : 'bg-gray-700 text-gray-400'
                                    }`}
                                    onClick={() => step < currentStep && goToStep(step)}
                                >
                                    {currentStep > step ? '✓' : step}
                                </div>
                                {step < 5 && (
                                    <div
                                        className={`flex-1 h-1 mx-2 transition-all ${
                                            currentStep > step
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                                : 'bg-gray-700'
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Requirements</span>
                        <span>Database</span>
                        <span>Admin</span>
                        <span>Settings</span>
                        <span>Complete</span>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50">
                    {renderStep()}
                </div>
                
                {/* Debug Info (remove in production) */}
                <div className="mt-4 text-xs text-gray-500">
                    Current Step: {currentStep} | Requirements Passed: {requirementsPassed ? 'Yes' : 'No'} | 
                    DB Test: {dbTestPassed ? 'Passed' : 'Not tested'}
                </div>
            </div>
        </div>
    );
};

export default InstallWizard;
