import axios from 'axios';

// Alpha Vantage API key (replace with your own API key)
const ALPHA_VANTAGE_API_KEY = '';

// List of example stock symbols to fetch data from
const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'FB', 'TSLA', 'BRK.A', 'V', 'JNJ', 'WMT'];

// Function to fetch a random stock price
const fetchRandomStockPrice = async () => {
  try {
    // Select a random stock symbol from the list
    const randomSymbol = stockSymbols[Math.floor(Math.random() * stockSymbols.length)];

    // Fetch stock data from Alpha Vantage
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'TIME_SERIES_INTRADAY',
        symbol: randomSymbol,
        interval: '5min',
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    // Extract the latest stock price
    const timeSeries = response.data['Time Series (5min)'];
    const latestTime = Object.keys(timeSeries)[0];
    const latestPrice = parseFloat(timeSeries[latestTime]['4. close']);

    return latestPrice;
  } catch (error) {
    console.error('Error fetching stock price:', error);
    // Return a default random price in case of an error
    return Math.floor(Math.random() * (500 - 50 + 1)) + 50;
  }
};

// Function to generate an initial price for a stock
const generateInitialPrice = async () => {
  const price = await fetchRandomStockPrice();
  return price;
};

export default generateInitialPrice;
