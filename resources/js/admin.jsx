// resources/js/admin.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import '../css/app.css';

// Configure axios
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

// Login Component
const LoginForm = ({ onLogin }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/login', credentials);
            if (response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                onLogin(response.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700/50">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-8">
                    Admin Login
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={credentials.email}
                            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={credentials.password}
                            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
                            required
                        />
                    </div>
                    
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white transition-all disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Admin Dashboard Component
const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [pages, setPages] = useState([]);
    const [users, setUsers] = useState([]);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ pages: 0, users: 0, visits: 0 });

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            try {
                const response = await axios.get('/api/user');
                setUser(response.data);
                loadDashboardData();
            } catch (err) {
                localStorage.removeItem('auth_token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const loadDashboardData = async () => {
        try {
            // Load pages
            const pagesRes = await axios.get('/api/pages');
            setPages(pagesRes.data.data || []);
            
            // Load users
            const usersRes = await axios.get('/api/users');
            setUsers(usersRes.data.data || []);
            
            // Load settings
            const settingsRes = await axios.get('/api/settings');
            setSettings(settingsRes.data || {});
            
            // Update stats
            setStats({
                pages: pagesRes.data.data?.length || 0,
                users: usersRes.data.data?.length || 0,
                visits: Math.floor(Math.random() * 1000) // Placeholder
            });
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('/api/logout');
        } catch (err) {
            // Continue with logout even if request fails
        }
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <LoginForm onLogin={setUser} />;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Astole CMS
                        </h1>
                        <span className="text-gray-400">Admin Panel</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-300">Welcome, {user.name}</span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-800 min-h-screen border-r border-gray-700">
                    <nav className="p-4 space-y-2">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                            { id: 'pages', label: 'Pages', icon: '📄' },
                            { id: 'users', label: 'Users', icon: '👥' },
                            { id: 'settings', label: 'Settings', icon: '⚙️' },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                    activeTab === item.id
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                }`}
                            >
                                <span className="mr-3">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {activeTab === 'dashboard' && (
                        <DashboardTab stats={stats} />
                    )}
                    
                    {activeTab === 'pages' && (
                        <PagesTab pages={pages} onUpdate={loadDashboardData} />
                    )}
                    
                    {activeTab === 'users' && (
                        <UsersTab users={users} onUpdate={loadDashboardData} />
                    )}
                    
                    {activeTab === 'settings' && (
                        <SettingsTab settings={settings} onUpdate={loadDashboardData} />
                    )}
                </main>
            </div>
        </div>
    );
};

// Dashboard Tab
const DashboardTab = ({ stats }) => (
    <div>
        <h2 className="text-3xl font-bold text-white mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Total Pages</div>
                <div className="text-3xl font-bold text-white">{stats.pages}</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Total Users</div>
                <div className="text-3xl font-bold text-white">{stats.users}</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Site Visits</div>
                <div className="text-3xl font-bold text-white">{stats.visits}</div>
            </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
                <a href="/" target="_blank" className="block px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
                    🌐 View Site
                </a>
                <button className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
                    📄 Create New Page
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
                    👤 Add New User
                </button>
            </div>
        </div>
    </div>
);

// Pages Tab
const PagesTab = ({ pages, onUpdate }) => {
    const [editingPage, setEditingPage] = useState(null);
    const [formData, setFormData] = useState({ title: '', slug: '', content: '', is_published: false });

    const handleSave = async () => {
        try {
            if (editingPage) {
                await axios.put(`/api/pages/${editingPage}`, formData);
            } else {
                await axios.post('/api/pages', formData);
            }
            setEditingPage(null);
            setFormData({ title: '', slug: '', content: '', is_published: false });
            onUpdate();
        } catch (err) {
            alert('Failed to save page: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this page?')) {
            try {
                await axios.delete(`/api/pages/${id}`);
                onUpdate();
            } catch (err) {
                alert('Failed to delete page');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Pages</h2>
                <button
                    onClick={() => {
                        setEditingPage(null);
                        setFormData({ title: '', slug: '', content: '', is_published: false });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    + New Page
                </button>
            </div>

            {editingPage !== undefined && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                        {editingPage ? 'Edit Page' : 'Create New Page'}
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Slug</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                rows={6}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                            />
                        </div>
                        
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_published}
                                onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                                className="mr-2"
                            />
                            <label className="text-gray-300">Published</label>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setEditingPage(undefined)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg border border-gray-700">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left px-6 py-4 text-gray-300">Title</th>
                            <th className="text-left px-6 py-4 text-gray-300">Slug</th>
                            <th className="text-left px-6 py-4 text-gray-300">Status</th>
                            <th className="text-right px-6 py-4 text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.map(page => (
                            <tr key={page.id} className="border-b border-gray-700">
                                <td className="px-6 py-4 text-white">{page.title}</td>
                                <td className="px-6 py-4 text-gray-400">/{page.slug}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-sm ${
                                        page.is_published 
                                            ? 'bg-green-600/20 text-green-400' 
                                            : 'bg-gray-600/20 text-gray-400'
                                    }`}>
                                        {page.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => {
                                            setEditingPage(page.id);
                                            setFormData(page);
                                        }}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(page.id)}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {pages.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        No pages found. Create your first page!
                    </div>
                )}
            </div>
        </div>
    );
};

// Users Tab
const UsersTab = ({ users, onUpdate }) => {
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'user', password: '' });

    const handleSave = async () => {
        try {
            const data = {...formData};
            if (!data.password) delete data.password;
            
            if (editingUser) {
                await axios.put(`/api/users/${editingUser}`, data);
            } else {
                await axios.post('/api/users', data);
            }
            setEditingUser(null);
            setFormData({ name: '', email: '', role: 'user', password: '' });
            onUpdate();
        } catch (err) {
            alert('Failed to save user: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`/api/users/${id}`);
                onUpdate();
            } catch (err) {
                alert('Failed to delete user');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Users</h2>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({ name: '', email: '', role: 'user', password: '' });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    + New User
                </button>
            </div>

            {editingUser !== undefined && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                        {editingUser ? 'Edit User' : 'Create New User'}
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                            >
                                <option value="user">User</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password {editingUser && '(leave blank to keep current)'}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                            />
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setEditingUser(undefined)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg border border-gray-700">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left px-6 py-4 text-gray-300">Name</th>
                            <th className="text-left px-6 py-4 text-gray-300">Email</th>
                            <th className="text-left px-6 py-4 text-gray-300">Role</th>
                            <th className="text-right px-6 py-4 text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-700">
                                <td className="px-6 py-4 text-white">{user.name}</td>
                                <td className="px-6 py-4 text-gray-400">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-sm ${
                                        user.role === 'admin' 
                                            ? 'bg-purple-600/20 text-purple-400' 
                                            : user.role === 'editor'
                                            ? 'bg-blue-600/20 text-blue-400'
                                            : 'bg-gray-600/20 text-gray-400'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => {
                                            setEditingUser(user.id);
                                            setFormData({...user, password: ''});
                                        }}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {users.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
};

// Settings Tab
const SettingsTab = ({ settings, onUpdate }) => {
    const [formData, setFormData] = useState({
        site_name: settings.site_name || '',
        site_url: settings.site_url || '',
        site_description: settings.site_description || '',
    });

    const handleSave = async () => {
        try {
            await axios.post('/api/settings', formData);
            alert('Settings saved successfully!');
            onUpdate();
        } catch (err) {
            alert('Failed to save settings');
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">Settings</h2>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
                        <input
                            type="text"
                            value={formData.site_name}
                            onChange={(e) => setFormData({...formData, site_name: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Site URL</label>
                        <input
                            type="url"
                            value={formData.site_url}
                            onChange={(e) => setFormData({...formData, site_url: e.target.value})}
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
                        <textarea
                            value={formData.site_description}
                            onChange={(e) => setFormData({...formData, site_description: e.target.value})}
                            rows={4}
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                    
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

// Mount the app
const rootElement = document.getElementById('admin-root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <AdminDashboard />
        </React.StrictMode>
    );
}
