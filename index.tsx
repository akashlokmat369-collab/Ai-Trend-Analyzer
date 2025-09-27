import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
interface Filters {
  country: string;
  state: string;
  district: string;
  city: string;
  language: string;
  category: string;
}

type UserRole = 'user' | 'admin';

interface User {
  username: string;
  password: string;
  role: UserRole;
}

// --- MOCK USER DATABASE ---
const initialUsers: User[] = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user', password: 'user123', role: 'user' },
];

// --- TREND ANALYZER COMPONENT (for 'user' role) ---
const TrendAnalyzerPage = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
  const [filters, setFilters] = useState<Filters>({
    country: '',
    state: '',
    district: '',
    city: '',
    language: 'english',
    category: 'all',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ text: string; sources: any[] }>({ text: '', sources: [] });
  const [error, setError] = useState<string>('');

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const analyzeTrends = async () => {
    setLoading(true);
    setResult({ text: '', sources: [] });
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let prompt = `Analyze the absolute latest, real-time trending topics from Google, YouTube, and social media. Predict potential viral news and suggest compelling, ready-to-publish story ideas for news editors.`;

      const locationFilters = [
        filters.city,
        filters.district,
        filters.state,
        filters.country,
      ].filter(Boolean).join(', ');

      if (locationFilters) {
        prompt += ` Focus the analysis on the following location: ${locationFilters}.`;
      }

      if (filters.language) {
        prompt += ` The language of the trends and story ideas should be ${filters.language}.`;
      }
      
      const categoryMap: { [key: string]: string } = {
        'entertainment': 'Lokmat Filmy',
        'women-oriented': 'Lokmat Sakhi',
        'devotional': 'Lokmat Bhakti',
      };

      if (filters.category && filters.category !== 'all') {
        const publication = categoryMap[filters.category];
        if (publication) {
            prompt += ` The analysis should focus on the '${filters.category}' category, with story ideas tailored for a publication like '${publication}'.`;
        } else {
            prompt += ` The analysis should focus on the '${filters.category}' category.`;
        }
      }
      
      prompt += ` Provide a concise, insightful analysis.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        },
      });

      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      setResult({ text: response.text, sources });

    } catch (err) {
      console.error("Error analyzing trends:", err);
      setError('Failed to analyze trends. Please check the console for more details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="page-header">
        <span>Welcome, {user.username}!</span>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
      <header>
        <h1>AI Trend Analyzer</h1>
        <p>Discover emerging trends and predict the next viral story.</p>
      </header>

      <div className="filters-container" role="form" aria-labelledby="filters-heading">
        <h2 id="filters-heading" className="sr-only">Analysis Filters</h2>
        <div className="filter-group">
          <input type="text" name="country" placeholder="Country" value={filters.country} onChange={handleFilterChange} aria-label="Country" />
          <input type="text" name="state" placeholder="State" value={filters.state} onChange={handleFilterChange} aria-label="State" />
          <input type="text" name="district" placeholder="District" value={filters.district} onChange={handleFilterChange} aria-label="District" />
          <input type="text" name="city" placeholder="City" value={filters.city} onChange={handleFilterChange} aria-label="City" />
        </div>
        <div className="filter-group">
          <select name="language" value={filters.language} onChange={handleFilterChange} aria-label="Language">
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="marathi">Marathi</option>
          </select>
          <select name="category" value={filters.category} onChange={handleFilterChange} aria-label="Category">
            <option value="all">All Categories</option>
            <option value="crime">Crime</option>
            <option value="sports">Sports</option>
            <option value="politics">Politics</option>
            <option value="social">Social</option>
            <option value="entertainment">Entertainment</option>
            <option value="women-oriented">Women Oriented</option>
            <option value="devotional">Devotional</option>
          </select>
        </div>
      </div>

      <button onClick={analyzeTrends} disabled={loading} aria-live="polite">
        {loading ? 'Analyzing...' : 'Analyze Current Trends'}
      </button>

      <section className="results-container" aria-labelledby="results-heading">
        <h2 id="results-heading" className="sr-only">Analysis Results</h2>
        {error && <p className="error" role="alert">{error}</p>}
        {result.text && (
          <div className="result-card">
            <pre>{result.text}</pre>
            {result.sources && result.sources.length > 0 && (
              <div>
                <h4>Sources:</h4>
                <ul>
                  {result.sources.map((source, index) => (
                    source.web && <li key={index}><a href={source.web.uri} target="_blank" rel="noopener noreferrer">{source.web.title || source.web.uri}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

// --- ADMIN PANEL COMPONENT (for 'admin' role) ---
const AdminPage = ({ users, onLogout, onAddUser, onChangePassword }: { users: User[], onLogout: () => void, onAddUser: (user: User) => boolean, onChangePassword: (username: string, newPass: string) => void }) => {
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('user');
  const [addError, setAddError] = useState('');
  
  const [changeUser, setChangeUser] = useState(users[0]?.username || '');
  const [changePassword, setChangePassword] = useState('');
  const [changeMessage, setChangeMessage] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername || !addPassword) {
      setAddError('Username and password cannot be empty.');
      return;
    }
    const success = onAddUser({ username: addUsername, password: addPassword, role: addRole });
    if (success) {
      setAddUsername('');
      setAddPassword('');
      setAddRole('user');
      setAddError('');
    } else {
      setAddError('Username already exists.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeUser || !changePassword) {
      setChangeMessage('Please select a user and enter a new password.');
      return;
    }
    onChangePassword(changeUser, changePassword);
    setChangePassword('');
    setChangeMessage(`Password for ${changeUser} has been updated.`);
    setTimeout(() => setChangeMessage(''), 3000);
  };

  return (
    <main className="container">
       <div className="page-header">
        <span>Admin Panel</span>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </div>

      <section className="admin-section">
        <h2>Manage Users</h2>
        <div className="user-list">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.username}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-forms-grid">
        <section className="admin-section">
          <h2>Add New User</h2>
          <form onSubmit={handleAddUser} className="admin-form">
            <input type="text" placeholder="Username" value={addUsername} onChange={e => setAddUsername(e.target.value)} required aria-label="New Username" />
            <input type="password" placeholder="Password" value={addPassword} onChange={e => setAddPassword(e.target.value)} required aria-label="New Password" />
            <select value={addRole} onChange={e => setAddRole(e.target.value as UserRole)} aria-label="Role">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit">Add User</button>
            {addError && <p className="error-message">{addError}</p>}
          </form>
        </section>

        <section className="admin-section">
          <h2>Change Password</h2>
          <form onSubmit={handleChangePassword} className="admin-form">
            <select value={changeUser} onChange={e => setChangeUser(e.target.value)} aria-label="Select User">
              {users.map(u => <option key={u.username} value={u.username}>{u.username}</option>)}
            </select>
            <input type="password" placeholder="New Password" value={changePassword} onChange={e => setChangePassword(e.target.value)} required aria-label="New Password" />
            <button type="submit">Change Password</button>
            {changeMessage && <p className="success-message">{changeMessage}</p>}
          </form>
        </section>
      </div>
    </main>
  );
};

// --- LOGIN PAGE COMPONENT ---
const LoginPage = ({ onLogin }: { onLogin: (username: string, password: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onLogin(username, password);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>AI Trend Analyzer</h1>
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required aria-label="Username" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required aria-label="Password" />
        <button type="submit">Login</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

// --- MAIN APP COMPONENT (CONTROLLER) ---
const App = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (username: string, password: string) => {
    const trimmedUsername = username.trim();

    const user = users.find(
      u => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.password === password.trim()
    );
    
    if (user) {
      setCurrentUser(user);
    } else {
      throw new Error('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddUser = (newUser: User) => {
    if (users.some(u => u.username.toLowerCase() === newUser.username.trim().toLowerCase())) {
      return false; // User already exists
    }
    setUsers([...users, newUser]);
    return true;
  };

  const handleChangePassword = (username: string, newPass: string) => {
    setUsers(users.map(u => u.username === username ? { ...u, password: newPass } : u));
  };
  
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentUser.role === 'admin') {
    return <AdminPage users={users} onLogout={handleLogout} onAddUser={handleAddUser} onChangePassword={handleChangePassword} />;
  }

  return <TrendAnalyzerPage user={currentUser} onLogout={handleLogout} />;
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);