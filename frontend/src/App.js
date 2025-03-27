import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MarketChart from './components/MarketChart';
import ChatInput from './components/ChatInput';
import AnalysisPanel from './components/AnalysisPanel';
import StrategyComparisonChart from './components/StrategyComparisonChart';
import InvestmentPortfolio from './components/InvestmentPortfolio';
import './App.css';

// Configure the base URL for API requests
const API_BASE_URL = 'http://localhost:5002';
axios.defaults.baseURL = API_BASE_URL;

function App() {
  const [marketData, setMarketData] = useState([]);
  const [timeFrame, setTimeFrame] = useState({
    startDate: null,
    endDate: null
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [strategiesData, setStrategiesData] = useState(null);
  const [strategySummary, setStrategySummary] = useState(null);
  const [simulatingStrategies, setSimulatingStrategies] = useState(false);
  const [activeTab, setActiveTab] = useState('market'); // 'market' or 'portfolio'

  // Fetch initial market data on component mount
  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/api/market-data`);
      
      if (response.data.status === 'success') {
        setMarketData(response.data.data);
        
        // Extract date range from the data
        if (response.data.data.length > 0) {
          const dates = response.data.data.map(item => new Date(item.date));
          const startDate = new Date(Math.min(...dates));
          const endDate = new Date(Math.max(...dates));
          
          setTimeFrame({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          });
        }
      } else {
        setError('Failed to fetch market data');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEvent = async (event) => {
    try {
      setAnalyzing(true);
      setStrategiesData(null);
      setStrategySummary(null);
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/api/analyze-event`, { event });
      
      if (response.data.status === 'success') {
        setMarketData(response.data.data);
        setTimeFrame(response.data.timeFrame);
        setAnalysis(response.data.analysis);
        
        // After successfully analyzing the event, simulate investment strategies
        simulateStrategies(event);
      } else {
        setError('Failed to analyze event');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const simulateStrategies = async (event) => {
    try {
      setSimulatingStrategies(true);
      
      const response = await axios.post(`${API_BASE_URL}/api/simulate-strategies`, { event });
      
      if (response.data.status === 'success') {
        setStrategiesData(response.data.strategies);
        setStrategySummary(response.data.summary);
      } else {
        setError('Failed to simulate investment strategies');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setSimulatingStrategies(false);
    }
  };

  const resetToDefault = () => {
    fetchMarketData();
    setAnalysis(null);
    setStrategiesData(null);
    setStrategySummary(null);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Market Confidence Application</h1>
          <p>Analyze the impact of global events on the MSCI World Index</p>
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'market' ? 'active' : ''}`}
              onClick={() => setActiveTab('market')}
            >
              Market Analysis
            </button>
            <button 
              className={`tab-button ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Investment Portfolio
            </button>
          </div>
        </header>

        {activeTab === 'market' ? (
          <>
            <div className="card">
              <div className="chart-header">
                <h2>MSCI World Index</h2>
                {timeFrame.startDate && timeFrame.endDate && (
                  <p>Showing data from {timeFrame.startDate} to {timeFrame.endDate}</p>
                )}
                {analysis && (
                  <button onClick={resetToDefault} className="reset-button">
                    Reset to Default View
                  </button>
                )}
              </div>
              
              {error && <div className="error">{error}</div>}
              
              {loading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <MarketChart data={marketData} />
              )}
            </div>

            <div className="card">
              <h2>Analyze Global Event Impact</h2>
              <p>Enter a global event to see its impact on the markets</p>
              <ChatInput onSubmit={analyzeEvent} isLoading={analyzing} />
              
              {analyzing && (
                <div className="loading">
                  <p>Analyzing the event impact...</p>
                  <div className="loading-spinner"></div>
                </div>
              )}
              
              {analysis && <AnalysisPanel analysis={analysis} />}
            </div>

            {simulatingStrategies && (
              <div className="card">
                <div className="loading">
                  <p>Simulating investment strategies...</p>
                  <div className="loading-spinner"></div>
                </div>
              </div>
            )}

            {strategiesData && !simulatingStrategies && (
              <div className="card">
                <StrategyComparisonChart strategiesData={strategiesData} summary={strategySummary} />
              </div>
            )}
          </>
        ) : (
          <InvestmentPortfolio />
        )}
      </div>
    </div>
  );
}

export default App;
