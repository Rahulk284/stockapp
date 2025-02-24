import React, { useState, useEffect } from 'react'
import { auth, db } from './firebase';
import './StockPop.css'
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import axios from 'axios';

function StockPop(props) {


    const { stockData, onBuyStock, onSellStock, setSelectedStock } = props;
    const [sharesInput, setSharesInput] = useState(0);
    const percentColor = props.stockData?.percentage < 0 ? 'red' : '#81c995';

    const [showPop, setShowPop] = useState(true)
    const [currentProfit, setCurrentProfit] = useState(0)
    const [totalEquity, setTotalEquity] = useState(0)
    const [totalShares, setTotalShares] = useState(0)
    const [averageCost, setAverageCost] = useState(0)
    const [profitShare, setProfitShare] = useState(0)
    const [percentChange, setPercentChange] = useState(0)

    const [sentiment, setSentiment] = useState(null);

    const handleSharesInputChange = (event) => {
        setSharesInput(event.target.value);
    };


    const handleBuyButtonClick = () => {
        setShowPop(true);
        const quantity = parseInt(sharesInput);
        if (!isNaN(quantity) && quantity > 0) {
          onBuyStock(quantity);
          setShowPop(false)
        } else {
          alert('Invalid input. Please enter a valid quantity.');
        }
    };

    const handleSellButtonClick = () => {
        setShowPop(true);
        const quantity = parseInt(sharesInput);
        if (!isNaN(quantity) && quantity > 0) {
          onSellStock(quantity);
          setShowPop(false)
        } else {
          alert('Invalid input. Please enter a valid quantity.');
        }
    };

    const handleClose = () => {
        setShowPop(false)
    }

    useEffect(() => {
        if (!showPop) {
          setSelectedStock(null);
        }
      }, [showPop]);
    

    useEffect(() => {
        // Fetch the profit value from Firestore and set it in the state
        const user = auth.currentUser;
        if (user) {
          db.collection('users')
            .doc(user.uid)
            .collection('userStocks')
            .where('ticker', '==', props.stockData.name)
            .get()
            .then((querySnapshot) => {
              let totalProfit = 0;
              let totalEquity = 0;
              let totalShares = 0;
              let averageCost = 0;
              let profitShare = 0;
              let percentChange = 0;
              let purchaseTotal = 0;
              querySnapshot.forEach((doc) => {
                const shares = doc.data().shares;
                const currentPrice = props.stockData.price;
                averageCost = doc.data().averageCost;
                totalProfit += shares * (currentPrice - averageCost);
                purchaseTotal = averageCost * shares
                totalEquity = averageCost * shares + totalProfit
                totalShares = shares
                profitShare = stockData.price - parseFloat(averageCost)
                console.log(profitShare)
                percentChange = (totalProfit / purchaseTotal) * 100;
              });
              setCurrentProfit(totalProfit);
              setTotalEquity(totalEquity)
              setTotalShares(totalShares)
              setAverageCost(averageCost)
              setProfitShare(profitShare)
              setPercentChange(percentChange)
            })
            .catch((error) => {
              console.error('Error fetching stock data:', error);
            });
        }
      }, [props.stockData.name, props.stockData.price]);

    const handleSentimentAnalysis = async () => {
        const tickerToCompanyName = {
            AAPL: "Apple",
            AMZN: "Amazon",
            GOOGL: "Alphabet",
            NVDA: "NVIDIA",
            IBM: "IBM",
            JPM: "JPMorgan Chase",
            BAC: "Bank of America",
            ORCL: "Oracle",
            CAT: "Caterpillar",
            NFLX: "Netflix",
            MSFT: "Microsoft",
            TSLA: "Tesla",
            META: "Meta",
            BABA: "Alibaba",
            UBER: "Uber",
            SBUX: "Starbucks",
            RIVN: "Rivian",
            VOO: "Vanguard S&P 500",
            AMC: "AMC Theaters",
            GME: "GameStop",
            NKE: "Nike"
        };

        const companyName = tickerToCompanyName[props.stockData.name];

        try {
            const response = await axios.post('https://0d0f-35-237-110-234.ngrok-free.app/analyze', {
                ticker: props.stockData.name,
                keyword: companyName,
            });
            setSentiment(response.data);
        } catch (error) {
            console.error('Error fetching sentiment:', error);
        }
    };

    
    if (!showPop) return null;
    return (
        <div className="pop__overlay">
            <div className="pop__content">
                <div className='pop__words'>
                    <div className='pop__name'>
                        <h2>
                            {stockData.name}:{' '}
                            <span>
                                {(stockData.price).toFixed(2)}
                            </span>
                        </h2>
                    </div>
                    
                    <div className='pop__price'>
                        <p style={{ color: percentColor }}>
                            <span>
                                {(stockData.price - stockData.openPrice).toFixed(2)}
                            </span>
                            ({(stockData.percentage).toFixed(2)}%)
                        </p>
                    </div>
                    
                    
                    <div className="pop__profit">
                        <div className='pop__profitLeft'>
                            <p className='pop__ownedShares'>Owned Shares: {(totalShares || 0)}</p>
                            <p className='pop__avgCost'>Avg Cost: ${(averageCost || 0).toFixed(2)}</p>
                            <p className='pop__equity'>Current Equity: ${(totalEquity || 0).toFixed(2)}</p>
                            <p className='pop__return'>Total Return: 
                                <span style={{fontSize: 18}}>
                                    {currentProfit >= 0 ? ' +' : ' -'}
                                    ${Math.abs(currentProfit || 0).toFixed(2)} ({currentProfit >= 0 ? '+' : ''}{(percentChange).toFixed(2)}%)
                                </span>
                            </p>
                        </div>
                        <div className='pop__space'>
                            <p> </p>
                        </div>
                        <div className='pop__sellRight'>
                            <div className='pop__input'>
                                <div className='pop__inputBox'>
                                    <p>Shares:</p>
                                    <input
                                        type='number'
                                        value={sharesInput}
                                        onChange={handleSharesInputChange}
                                    />
                                </div>
                                <div className='pop__buystats'>
                                    <p>
                                        Total: 
                                        <span style={{fontWeight: 900}}> ${(stockData.price * parseFloat(sharesInput)).toFixed(2)} </span> 
                                    </p>
                                </div>
                            </div>
                            
                            <div className='pop__buysell'>
                                <button onClick={handleBuyButtonClick}>Buy</button>
                                <div className='pop__sell'>
                                    <button onClick={handleSellButtonClick}>Sell</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Sentiment Analysis Section */}
                    <div className="pop__sentiment">
                        <button onClick={handleSentimentAnalysis}>Analyze Sentiment</button>
                        <span className="info-icon" data-tooltip="Sentiment analysis is based on an AI model analyzing recent news articles and media content listed on Yahoo Finance.">
                            <HelpIcon />
                        </span>

                        {sentiment && (
                            <div>
                                <h2 
                                    style={{ 
                                        color: sentiment && sentiment.overall_sentiment === 'Positive' ? 'green' : 
                                        sentiment && sentiment.overall_sentiment === 'Negative' ? 'red' : 
                                        sentiment && sentiment.overall_sentiment === 'Neutral' ? 'yellow' : 'white' 
                                    }}
                                >
                                    Overall Sentiment: {sentiment ? sentiment.overall_sentiment : 'Loading...'}
                                </h2>
                                <p>Confidence: {sentiment.score}</p>
                                <p> ---------------------------------------------------------------------------------------- </p>
                                <h3>A Recent Article:</h3>
                                <ul>
                                    {sentiment.articles.slice(0, 1).map((article, index) => (
                                        <li key={index}>
                                            <a href={article.link} target="_blank" rel="noopener noreferrer">
                                                {article.title}
                                            </a>
                                            <p>Sentiment for this article: {article.sentiment} </p>
                                            <p> ---------------------------------------------------------------------------------------- </p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    
                    <div className='pop__close' onClick={handleClose}><CloseIcon/></div>
                </div>
            </div>
        </div>
      );
}

export default StockPop