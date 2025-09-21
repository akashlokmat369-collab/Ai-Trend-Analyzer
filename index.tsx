import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

interface Filters {
  country: string;
  state: string;
  district: string;
  city: string;
  language: string;
  category: string;
}

const App = () => {
  const [filters, setFilters] = useState<Filters>({
    country: '',
    state: '',
    district: '',
    city: '',
    language: 'english',
    category: 'all',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>('');
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
    setResult('');
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
      });

      setResult(response.text);

    } catch (err) {
      console.error("Error analyzing trends:", err);
      setError('Failed to analyze trends. Please check the console for more details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header>
        <h1>AI Trend Analyzer</h1>
        <p>Discover emerging trends and predict the next viral story.</p>
      </header>

      <div className="filters-container" role="form" aria-labelledby="filters-heading">
        <h2 id="filters-heading" className="sr-only">Analysis Filters</h2>
        <div className="filter-group">
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={filters.country}
            onChange={handleFilterChange}
            aria-label="Country"
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={filters.state}
            onChange={handleFilterChange}
            aria-label="State"
          />
          <input
            type="text"
            name="district"
            placeholder="District"
            value={filters.district}
            onChange={handleFilterChange}
            aria-label="District"
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            value={filters.city}
            onChange={handleFilterChange}
            aria-label="City"
          />
        </div>
        <div className="filter-group">
          <select 
            name="language" 
            value={filters.language} 
            onChange={handleFilterChange}
            aria-label="Language"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="marathi">Marathi</option>
          </select>
          <select 
            name="category" 
            value={filters.category} 
            onChange={handleFilterChange}
            aria-label="Category"
          >
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
        {result && (
          <div className="result-card">
            <pre>{result}</pre>
          </div>
        )}
      </section>
    </main>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);