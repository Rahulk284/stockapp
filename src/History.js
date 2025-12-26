import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './History.css';

function History() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchTransactions(user);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchTransactions = (user) => {
        db.collection('users')
            .doc(user.uid)
            .collection('transactions')
            .orderBy('timestamp', 'desc')
            .get()
            .then((querySnapshot) => {
                const transactionData = [];
                querySnapshot.forEach((doc) => {
                    transactionData.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                setTransactions(transactionData);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching transactions:', error);
                setLoading(false);
            });
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="history">
                <div className="history__container">
                    <div className="history__loading">Loading transactions...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="history">
            <div className="history__container">
                <button className="history__back" onClick={() => navigate('/home')}>
                    <ArrowBackIcon /> Back to Home
                </button>

                <div className="history__header">
                    <h1>Transaction History</h1>
                    <p className="history__subtitle">All your buy and sell transactions</p>
                </div>

                {transactions.length === 0 ? (
                    <div className="history__empty">
                        <p>No transactions yet.</p>
                        <p>Your buy and sell transactions will appear here.</p>
                    </div>
                ) : (
                    <div className="history__tableWrapper">
                        <table className="history__table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Ticker</th>
                                    <th>Action</th>
                                    <th>Shares</th>
                                    <th>Price/Share</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id}>
                                        <td className="history__date">
                                            {formatDate(transaction.timestamp)}
                                        </td>
                                        <td className="history__ticker">
                                            {transaction.ticker}
                                        </td>
                                        <td className={`history__action ${transaction.action === 'buy' ? 'buy' : 'sell'}`}>
                                            {transaction.action === 'buy' ? 'Buy' : 'Sell'}
                                        </td>
                                        <td className="history__shares">
                                            {transaction.shares}
                                        </td>
                                        <td className="history__price">
                                            ${transaction.pricePerShare?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className={`history__total ${transaction.action === 'buy' ? 'buy' : 'sell'}`}>
                                            {transaction.action === 'buy' ? '-' : '+'}${transaction.total?.toFixed(2) || '0.00'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="history__summary">
                    <div className="history__summaryItem">
                        <span className="history__summaryLabel">Total Transactions</span>
                        <span className="history__summaryValue">{transactions.length}</span>
                    </div>
                    <div className="history__summaryItem">
                        <span className="history__summaryLabel">Buy Orders</span>
                        <span className="history__summaryValue buy">
                            {transactions.filter(t => t.action === 'buy').length}
                        </span>
                    </div>
                    <div className="history__summaryItem">
                        <span className="history__summaryLabel">Sell Orders</span>
                        <span className="history__summaryValue sell">
                            {transactions.filter(t => t.action === 'sell').length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default History;
