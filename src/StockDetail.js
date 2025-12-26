import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import firebase from 'firebase/compat/app';
import axios from 'axios';
import LineGraph from './LineGraph';
import HelpIcon from '@mui/icons-material/Help';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './StockDetail.css';

const TOKEN = "cj0ofe9r01qgc2gj6vb0cj0ofe9r01qgc2gj6vbg";
const BASE_URL = "https://finnhub.io/api/v1";

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

function StockDetail() {
    const { ticker } = useParams();
    const navigate = useNavigate();
    const user = auth.currentUser;

    // Quote data
    const [quoteData, setQuoteData] = useState(null);
    // Company profile
    const [companyProfile, setCompanyProfile] = useState(null);
    // Chart data
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{
            label: "Price History",
            data: [],
            fill: false,
            backgroundColor: "#5AC53B",
            borderColor: "#5AC53B",
            borderWidth: 2,
            pointBorderColor: 'rgba(0, 0, 0, 0)',
            pointBackgroundColor: 'rgba(0, 0, 0, 0)',
            pointHoverBackgroundColor: '#5AC53B',
            pointHoverBorderColor: '#000000',
            pointHoverBorderWidth: 1,
            pointHoverRadius: 6,
        }]
    });
    // Position data
    const [totalShares, setTotalShares] = useState(0);
    const [averageCost, setAverageCost] = useState(0);
    const [totalEquity, setTotalEquity] = useState(0);
    const [currentProfit, setCurrentProfit] = useState(0);
    const [percentChange, setPercentChange] = useState(0);
    // Trading
    const [sharesInput, setSharesInput] = useState(0);
    // Buying Power
    const [buyingPower, setBuyingPower] = useState(0);
    // Sentiment
    const [sentiment, setSentiment] = useState(null);
    // Loading
    const [loading, setLoading] = useState(true);
    const [chartDataAvailable, setChartDataAvailable] = useState(false);

    // Fetch quote data
    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/quote?symbol=${ticker}&token=${TOKEN}`);
                setQuoteData(response.data);
            } catch (error) {
                console.error('Error fetching quote:', error);
            }
        };

        const fetchCompanyProfile = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/stock/profile2?symbol=${ticker}&token=${TOKEN}`);
                setCompanyProfile(response.data);
            } catch (error) {
                console.error('Error fetching company profile:', error);
            }
        };

        const fetchCandles = async () => {
            try {
                const now = Math.floor(Date.now() / 1000);
                const thirtyDaysAgo = now - (30 * 24 * 60 * 60);

                const response = await axios.get(
                    `${BASE_URL}/stock/candle?symbol=${ticker}&resolution=D&from=${thirtyDaysAgo}&to=${now}&token=${TOKEN}`
                );

                if (response.data.s === 'ok' && response.data.c) {
                    const closePrices = response.data.c;
                    const timestamps = response.data.t;

                    const labels = timestamps.map(ts => {
                        const d = new Date(ts * 1000);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                    });

                    const latestPrice = closePrices[closePrices.length - 1];
                    const firstPrice = closePrices[0];
                    const isPositive = latestPrice >= firstPrice;

                    setChartData({
                        labels: labels,
                        datasets: [{
                            label: "Price History",
                            data: closePrices,
                            fill: false,
                            backgroundColor: isPositive ? "#5AC53B" : "#ff4d4d",
                            borderColor: isPositive ? "#5AC53B" : "#ff4d4d",
                            borderWidth: 2,
                            pointBorderColor: 'rgba(0, 0, 0, 0)',
                            pointBackgroundColor: 'rgba(0, 0, 0, 0)',
                            pointHoverBackgroundColor: isPositive ? '#5AC53B' : '#ff4d4d',
                            pointHoverBorderColor: '#000000',
                            pointHoverBorderWidth: 1,
                            pointHoverRadius: 6,
                        }]
                    });
                    setChartDataAvailable(true);
                }
            } catch (error) {
                console.error('Error fetching price history:', error);
            }
        };

        Promise.all([fetchQuote(), fetchCompanyProfile(), fetchCandles()])
            .finally(() => setLoading(false));
    }, [ticker]);

    // Fetch user position
    useEffect(() => {
        if (user && quoteData) {
            db.collection('users')
                .doc(user.uid)
                .collection('userStocks')
                .where('ticker', '==', ticker)
                .get()
                .then((querySnapshot) => {
                    let shares = 0;
                    let avgCost = 0;
                    let equity = 0;
                    let profit = 0;
                    let pctChange = 0;

                    querySnapshot.forEach((doc) => {
                        shares = doc.data().shares;
                        avgCost = doc.data().averageCost;
                        const currentPrice = quoteData.c;
                        profit = shares * (currentPrice - avgCost);
                        equity = avgCost * shares + profit;
                        const purchaseTotal = avgCost * shares;
                        pctChange = purchaseTotal > 0 ? (profit / purchaseTotal) * 100 : 0;
                    });

                    setTotalShares(shares);
                    setAverageCost(avgCost);
                    setTotalEquity(equity);
                    setCurrentProfit(profit);
                    setPercentChange(pctChange);
                })
                .catch((error) => {
                    console.error('Error fetching position:', error);
                });
        }
    }, [user, ticker, quoteData]);

    // Fetch buying power
    useEffect(() => {
        if (user) {
            const unsubscribe = db.collection('users')
                .doc(user.uid)
                .collection('userData')
                .doc('buyingPower')
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        setBuyingPower(doc.data().amount || 0);
                    }
                }, (error) => {
                    console.error('Error fetching buying power:', error);
                });

            return () => unsubscribe();
        }
    }, [user]);

    const updateBuyingPower = (amount) => {
        db.collection('users')
            .doc(user?.uid)
            .collection('userData')
            .doc('buyingPower')
            .update({ amount });
    };

    const logTransaction = (action, shares, pricePerShare, total) => {
        db.collection('users')
            .doc(user?.uid)
            .collection('transactions')
            .add({
                ticker: ticker,
                action: action,
                shares: shares,
                pricePerShare: pricePerShare,
                total: total,
                date: new Date().toLocaleDateString('en-US'),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log('Transaction logged successfully');
            })
            .catch((error) => {
                console.error('Error logging transaction:', error);
            });
    };

    const buyStock = (quantity) => {
        quantity = parseInt(quantity);
        if (!isNaN(quantity) && quantity > 0 && quoteData) {
            const currentPrice = quoteData.c;
            const totalCost = quantity * currentPrice;

            db.collection('users')
                .doc(user?.uid)
                .collection('userData')
                .doc('buyingPower')
                .get()
                .then((doc) => {
                    if (doc.exists) {
                        const currentBuyingPower = doc.data().amount;
                        if (currentBuyingPower >= totalCost) {
                            updateBuyingPower(currentBuyingPower - totalCost);

                            db.collection('users')
                                .doc(user?.uid)
                                .collection('userStocks')
                                .where("ticker", "==", ticker)
                                .get()
                                .then((querySnapshot) => {
                                    if (querySnapshot.docs.length > 0) {
                                        let totalShares = 0;
                                        let totalValue = 0;

                                        querySnapshot.forEach((doc) => {
                                            const shares = doc.data().shares;
                                            const averageCost = doc.data().averageCost;
                                            totalShares += shares;
                                            totalValue += shares * averageCost;
                                        });

                                        totalShares += quantity;
                                        totalValue += quantity * currentPrice;
                                        const newAveragePrice = totalValue / totalShares;

                                        querySnapshot.forEach(function(doc) {
                                            db.collection('users')
                                                .doc(user.uid)
                                                .collection('userStocks')
                                                .doc(doc.id)
                                                .update({
                                                    shares: totalShares,
                                                    averageCost: newAveragePrice,
                                                });
                                        });

                                        // Update local state
                                        setTotalShares(totalShares);
                                        setAverageCost(newAveragePrice);
                                        setTotalEquity(totalShares * currentPrice);
                                        setCurrentProfit(totalShares * (currentPrice - newAveragePrice));

                                        // Log the buy transaction
                                        logTransaction('buy', quantity, currentPrice, totalCost);
                                    } else {
                                        db.collection('users')
                                            .doc(user.uid)
                                            .collection('userStocks')
                                            .add({
                                                ticker: ticker,
                                                shares: quantity,
                                                averageCost: currentPrice
                                            });

                                        // Update local state
                                        setTotalShares(quantity);
                                        setAverageCost(currentPrice);
                                        setTotalEquity(quantity * currentPrice);
                                        setCurrentProfit(0);

                                        // Log the buy transaction
                                        logTransaction('buy', quantity, currentPrice, totalCost);
                                    }
                                });
                        } else {
                            alert('Insufficient buying power.');
                        }
                    }
                });
        } else {
            alert('Invalid input. Please enter a valid quantity.');
        }
    };

    const sellStock = (quantity) => {
        quantity = parseInt(quantity);
        if (!isNaN(quantity) && quantity > 0 && quoteData) {
            const currentPrice = quoteData.c;

            db.collection('users')
                .doc(user?.uid)
                .collection('userStocks')
                .where('ticker', '==', ticker)
                .get()
                .then((querySnapshot) => {
                    let avgCost = 0;
                    let shares = 0;

                    querySnapshot.forEach((doc) => {
                        shares = doc.data().shares;
                        avgCost = doc.data().averageCost;
                    });

                    const shareProfit = currentPrice - avgCost;
                    const totalProfit = shareProfit * quantity;

                    if (shares >= quantity) {
                        const totalSell = (quantity * shareProfit) + (quantity * avgCost);

                        db.collection('users')
                            .doc(user?.uid)
                            .collection('userData')
                            .doc('buyingPower')
                            .get()
                            .then((doc) => {
                                if (doc.exists) {
                                    const currentBuyingPower = doc.data().amount;
                                    updateBuyingPower(currentBuyingPower + totalSell);
                                }
                            });

                        db.collection('users')
                            .doc(user?.uid)
                            .collection('userData')
                            .doc('Portfolio')
                            .get()
                            .then((doc) => {
                                if (doc.exists) {
                                    const existingTotalSoldProfit = doc.data().totalSoldProfit || 0;
                                    const updatedTotalSoldProfit = existingTotalSoldProfit + totalProfit;

                                    db.collection('users')
                                        .doc(user?.uid)
                                        .collection('userData')
                                        .doc('Portfolio')
                                        .update({
                                            totalSoldProfit: updatedTotalSoldProfit,
                                        });
                                } else {
                                    db.collection('users')
                                        .doc(user?.uid)
                                        .collection('userData')
                                        .doc('Portfolio')
                                        .set({
                                            totalSoldProfit: totalProfit,
                                        });
                                }
                            });

                        if (shares === quantity) {
                            querySnapshot.forEach((doc) => {
                                doc.ref.delete();
                            });
                            setTotalShares(0);
                            setAverageCost(0);
                            setTotalEquity(0);
                            setCurrentProfit(0);
                            setPercentChange(0);
                        } else {
                            const remainingShares = shares - quantity;
                            querySnapshot.forEach((doc) => {
                                doc.ref.update({
                                    shares: remainingShares,
                                });
                            });
                            setTotalShares(remainingShares);
                            setTotalEquity(remainingShares * currentPrice);
                            setCurrentProfit(remainingShares * (currentPrice - avgCost));
                        }

                        // Log the sell transaction
                        logTransaction('sell', quantity, currentPrice, totalSell);
                    } else {
                        alert('You do not have enough shares to sell.');
                    }
                })
                .catch((error) => {
                    console.error('Error selling shares:', error);
                });
        } else {
            alert('Invalid input. Please enter a valid quantity.');
        }
    };

    const handleBuyButtonClick = () => {
        const quantity = parseInt(sharesInput);
        if (!isNaN(quantity) && quantity > 0) {
            buyStock(quantity);
            setSharesInput(0);
        } else {
            alert('Invalid input. Please enter a valid quantity.');
        }
    };

    const handleSellButtonClick = () => {
        const quantity = parseInt(sharesInput);
        if (!isNaN(quantity) && quantity > 0) {
            sellStock(quantity);
            setSharesInput(0);
        } else {
            alert('Invalid input. Please enter a valid quantity.');
        }
    };

    const handleSentimentAnalysis = async () => {
        const companyName = tickerToCompanyName[ticker];

        try {
            const response = await axios.post('https://0d0f-35-237-110-234.ngrok-free.app/analyze', {
                ticker: ticker,
                keyword: companyName,
            });
            setSentiment(response.data);
        } catch (error) {
            console.error('Error fetching sentiment:', error);
        }
    };

    if (loading || !quoteData) {
        return (
            <div className="stockDetail">
                <div className="stockDetail__container">
                    <div className="stockDetail__loading">Loading...</div>
                </div>
            </div>
        );
    }

    const dailyChange = quoteData.c - quoteData.o;
    const dailyChangePercent = ((dailyChange) / quoteData.o) * 100;
    const isPositive = dailyChange >= 0;

    return (
        <div className="stockDetail">
            <div className="stockDetail__container">
                {/* Back Button */}
                <button className="stockDetail__back" onClick={() => navigate('/home')}>
                    <ArrowBackIcon /> Back to Home
                </button>

                {/* Header Section */}
                <div className="stockDetail__header">
                    <div className="stockDetail__headerLeft">
                        <h1 className="stockDetail__ticker">{ticker}</h1>
                        <h2 className="stockDetail__companyName">
                            {companyProfile?.name || tickerToCompanyName[ticker] || ticker}
                        </h2>
                    </div>
                    <div className="stockDetail__headerRight">
                        <p className="stockDetail__price">${quoteData.c.toFixed(2)}</p>
                        <p className={`stockDetail__change ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '+' : ''}{dailyChange.toFixed(2)} ({isPositive ? '+' : ''}{dailyChangePercent.toFixed(2)}%)
                        </p>
                    </div>
                </div>

                {/* Price Chart */}
                <div className="stockDetail__chart">
                    <h3>Price History (30 Days)</h3>
                    {chartDataAvailable ? (
                        <LineGraph chartData={chartData} />
                    ) : (
                        <p className="stockDetail__chartUnavailable">Price history unavailable</p>
                    )}
                </div>

                {/* Company Info Section */}
                <div className="stockDetail__companyInfo">
                    <h3>Company Information</h3>
                    <div className="stockDetail__infoGrid">
                        <div className="stockDetail__infoItem">
                            <span className="stockDetail__infoLabel">Industry</span>
                            <span className="stockDetail__infoValue">{companyProfile?.finnhubIndustry || 'N/A'}</span>
                        </div>
                        <div className="stockDetail__infoItem">
                            <span className="stockDetail__infoLabel">Market Cap</span>
                            <span className="stockDetail__infoValue">
                                {companyProfile?.marketCapitalization
                                    ? `$${(companyProfile.marketCapitalization / 1000).toFixed(2)}B`
                                    : 'N/A'}
                            </span>
                        </div>
                        <div className="stockDetail__infoItem">
                            <span className="stockDetail__infoLabel">52-Week High</span>
                            <span className="stockDetail__infoValue">${quoteData.h?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="stockDetail__infoItem">
                            <span className="stockDetail__infoLabel">52-Week Low</span>
                            <span className="stockDetail__infoValue">${quoteData.l?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="stockDetail__infoItem">
                            <span className="stockDetail__infoLabel">Open</span>
                            <span className="stockDetail__infoValue">${quoteData.o?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="stockDetail__infoItem">
                            <span className="stockDetail__infoLabel">Previous Close</span>
                            <span className="stockDetail__infoValue">${quoteData.pc?.toFixed(2) || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Your Position Section */}
                {totalShares > 0 && (
                    <div className="stockDetail__position">
                        <h3>Your Position</h3>
                        <div className="stockDetail__positionGrid">
                            <div className="stockDetail__positionItem">
                                <span className="stockDetail__positionLabel">Shares Owned</span>
                                <span className="stockDetail__positionValue">{totalShares}</span>
                            </div>
                            <div className="stockDetail__positionItem">
                                <span className="stockDetail__positionLabel">Average Cost</span>
                                <span className="stockDetail__positionValue">${averageCost.toFixed(2)}</span>
                            </div>
                            <div className="stockDetail__positionItem">
                                <span className="stockDetail__positionLabel">Total Equity</span>
                                <span className="stockDetail__positionValue">${totalEquity.toFixed(2)}</span>
                            </div>
                            <div className="stockDetail__positionItem">
                                <span className="stockDetail__positionLabel">Total Return</span>
                                <span className={`stockDetail__positionValue ${currentProfit >= 0 ? 'positive' : 'negative'}`}>
                                    {currentProfit >= 0 ? '+' : ''}{currentProfit.toFixed(2)} ({percentChange.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trade Section */}
                <div className="stockDetail__trade">
                    <h3>Trade {ticker}</h3>
                    <div className="stockDetail__buyingPower">
                        <span className="stockDetail__buyingPowerLabel">Buying Power:</span>
                        <span className="stockDetail__buyingPowerValue">
                            ${buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="stockDetail__tradeContent">
                        <div className="stockDetail__tradeInput">
                            <label>Shares</label>
                            <input
                                type="number"
                                value={sharesInput}
                                onChange={(e) => setSharesInput(e.target.value)}
                                min="0"
                            />
                        </div>
                        <div className="stockDetail__tradeTotal">
                            <span>Total: </span>
                            <span className="stockDetail__tradeTotalValue">
                                ${(quoteData.c * parseFloat(sharesInput || 0)).toFixed(2)}
                            </span>
                        </div>
                        <div className="stockDetail__tradeButtons">
                            <button className="stockDetail__buyBtn" onClick={handleBuyButtonClick}>Buy</button>
                            <button className="stockDetail__sellBtn" onClick={handleSellButtonClick}>Sell</button>
                        </div>
                    </div>
                </div>

                {/* Sentiment Section */}
                <div className="stockDetail__sentiment">
                    <h3>
                        Sentiment Analysis
                        <span className="stockDetail__sentimentInfo" data-tooltip="Sentiment analysis is based on an AI model analyzing recent news articles and media content.">
                            <HelpIcon />
                        </span>
                    </h3>
                    <button className="stockDetail__sentimentBtn" onClick={handleSentimentAnalysis}>
                        Analyze Sentiment
                    </button>

                    {sentiment && (
                        <div className="stockDetail__sentimentResult">
                            <h4
                                className={`stockDetail__sentimentOverall ${
                                    sentiment.overall_sentiment === 'Positive' ? 'positive' :
                                    sentiment.overall_sentiment === 'Negative' ? 'negative' : 'neutral'
                                }`}
                            >
                                Overall Sentiment: {sentiment.overall_sentiment}
                            </h4>
                            <p className="stockDetail__sentimentConfidence">Confidence: {sentiment.score}</p>

                            {sentiment.articles && sentiment.articles.length > 0 && (
                                <div className="stockDetail__sentimentArticles">
                                    <h5>Recent Article:</h5>
                                    <ul>
                                        {sentiment.articles.slice(0, 1).map((article, index) => (
                                            <li key={index}>
                                                <a href={article.link} target="_blank" rel="noopener noreferrer">
                                                    {article.title}
                                                </a>
                                                <p>Sentiment: {article.sentiment}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StockDetail;
