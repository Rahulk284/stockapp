import React, { useEffect, useState } from 'react'
import './StatsRow.css'
import './Stats.js'
import StockPop from './StockPop'
import { db, auth } from './firebase'
import { doc } from '@firebase/firestore';


let newStockProfits = new Set();

function StatsRow(props) {

  const percentage = ((props.price - props.openPrice)/props.openPrice) * 100;
  const user = auth.currentUser;

  const [buyQuantity, setBuyQuantity] = useState(1);
  const [showPop, setShowPop] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [profit, setProfit] = useState('');


  
useEffect(() => {
    calculateTotalProfitLoss()
    newStockProfits = [];
}, [user?.uid]);

const formatDate= (dateString) => {
  const dateObj = new Date(dateString);
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${month}/${day}/${year}`;
}

const calculateTotalProfitLoss = () => {
  if (!user) return;
  db.collection('users')
    .doc(user.uid)
    .collection('userStocks')
    .get()
    .then((querySnapshot) => {
      let totalInvestmentCost = 0;
      let currentInvestmentValue = 0;
      let totalProfitLoss = 0;
      const stockHoldings = [];
      

      querySnapshot.forEach((doc) => {
        const shares = doc.data().shares;
        const averageCost = doc.data().averageCost;
        const ticker = doc.data().ticker;
        const currentPrice = props.name === ticker ? props.price : null;

        totalInvestmentCost += shares * averageCost;

        if (currentPrice !== null) {
          currentInvestmentValue += shares * currentPrice;
          // Calculate the profit or loss for the current stock holding
          const profitLoss = shares * currentPrice - shares * averageCost;
          console.log(profitLoss)
          db.collection('users')
            .doc(user.uid)
            .collection('userStocks')
            .doc(doc.id)
            .update({
              profitLoss: profitLoss,
            })

          totalProfitLoss += profitLoss;
          stockHoldings.push({
            ticker,
            shares,
            averageCost,
            currentPrice,
            profitLoss,
          });
          if(!newStockProfits.includes(profitLoss)){
              newStockProfits.push(profitLoss);
          }
        }
      });

      const totalProfitLossAmount = newStockProfits.reduce((acc, profitLoss) => acc + profitLoss, 0);
      updateProfitPortfolio(totalProfitLossAmount);

      const currentDate = new Date().toISOString();
      const formattedDate = formatDate(currentDate);
      updatePortfolioHistory(formattedDate);
    })
    .catch((error) => {
      console.error('Error calculating total profit/loss:', error);
    });
};



const updatePortfolioHistory = (date) => {
  const userUid = user?.uid;
  let portfolioValue = 0;
  if (!userUid) {
    console.error("User ID not available. Cannot update portfolio history.");
    return;
  }
  db.collection('users')
    .doc(userUid)
    .collection('userData')
    .doc('Portfolio')
    .get()
    .then((doc) => {
      if(doc.exists) {

        portfolioValue = doc.data().amount;
      }
    })

  // Get the current portfolio history from the database
  db.collection('users')
    .doc(userUid)
    .collection('userData')
    .doc('portfolioHistory')
    .get()
    .then((doc) => {
      if (doc.exists) {
        // If the document already exists, update it with the new data
        const updatedData = [...doc.data().data, { date, portfolioValue }];
        db.collection('users')
          .doc(userUid)
          .collection('userData')
          .doc('portfolioHistory')
          .update({ data: updatedData })
          .then(() => {
            console.log("Portfolio history updated successfully.");
          })
          .catch((error) => {
            console.error("Error updating portfolio history:", error);
          });
      } else {
        // If the document doesn't exist, create a new one with the initial data
        const initialData = [{ date, portfolioValue }];
        db.collection('users')
          .doc(userUid)
          .collection('userData')
          .doc('portfolioHistory')
          .set({ data: initialData })
          .then(() => {
            console.log("New portfolio history document created successfully.");
          })
          .catch((error) => {
            console.error("Error creating portfolio history document:", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error getting portfolio history document:", error);
    });
};


  const handleBuyQuantityChange = (event) => {
      setBuyQuantity(event.target.value);
  }

  const updateBuyingPower = (amount) => {
    db.collection('users')
      .doc(user?.uid)
      .collection('userData')
      .doc('buyingPower')
      .update({ amount })
  };

//   const updatePortfolio = (amount) => {
//     let newPortfolioAmount = 0
//     let portfolioData = 0

//     db.collection('users')
//       .doc(user?.uid)
//       .collection('userData')
//       .doc('Portfolio')
//       .get()
//       .then((portfolioDoc) => {
//           if(portfolioDoc.exists){
//             const currentPortfolioAmount = portfolioDoc.data().amount;
//             console.log(currentPortfolioAmount)
//             console.log(amount)
//             newPortfolioAmount = currentPortfolioAmount + amount;

//             portfolioData = { amount: newPortfolioAmount };


//             db.collection('users')
//               .doc(user?.uid)
//               .collection('userData')
//               .doc('Portfolio')
//               .update(portfolioData)
//         }
//     })
//   };
  
  const updateProfitPortfolio = (amount) => {
    const userUid = user?.uid;
    if (!userUid) {
      console.error("User ID not available. Cannot update portfolio.");
      return;
    }
  
    // Get the current portfolio amount from the database
    db.collection('users')
      .doc(userUid)
      .collection('userData')
      .doc('Portfolio')
      .get()
      .then((doc) => {
        if (doc.exists) {
          let totalSoldProfit = doc.data().totalSoldProfit;
          let newAmount = 10000 + amount
          if (totalSoldProfit) {
            newAmount += totalSoldProfit
          }
          // Update the database with the new total amount
          db.collection('users')
            .doc(userUid)
            .collection('userData')
            .doc('Portfolio')
            .update({ amount: newAmount })
            .then(() => {
            })
            .catch((error) => {
              console.error("Error updating portfolio amount:", error);
            });
            db.collection('users')
              .doc(userUid)
              .collection('userData')
              .doc('Portfolio')
              .update({
                  currentProfit: amount,
              })

              // const timestamp = new Date().toISOString();
              // updatePortfolioHistory(timestamp, profitAmount);
        } else {
          console.error("Portfolio document does not exist.");
        }
      })
      .catch((error) => {
        console.error("Error getting portfolio document:", error);
      });
  };
  

  const buyStock = (quantity) => {
    quantity = parseInt(quantity);
    console.log(quantity)
    if(!isNaN(quantity) && quantity > 0) {

        const totalCost = quantity * props.price;
        console.log(totalCost)
        db.collection('users')
        .doc(user?.uid)
        .collection('userData')
        .doc('buyingPower')
        .get()
        .then((doc) => {
            if (doc.exists) {
                const currentBuyingPower = doc.data().amount;

                if (currentBuyingPower >= totalCost) {
                    // Sufficient buying power, proceed with the purchase
                    // Update the buying power by subtracting the total cost
                    updateBuyingPower(currentBuyingPower - totalCost);
                    db
                    .collection('users')
                    .doc(user?.uid)
                    .collection('userStocks')
                    .where("ticker", "==", props.name)
                    .get()
                    .then((querySnapshot) => {
                        if(querySnapshot.docs.length > 0){
                            let totalShares = 0;
                            let totalValue = 0;
            
                            querySnapshot.forEach((doc) => {
                                const shares = doc.data().shares;
                                const averageCost = doc.data().averageCost;
                                totalShares += shares;
                                totalValue += shares * averageCost;
                            });
            
                            totalShares += quantity;
                            totalValue += quantity * props.price;
                            const newAveragePrice = totalValue / totalShares
                            // updatePortfolio(totalCost)
                            querySnapshot.forEach(function(doc) {
                                db.collection('users')
                                .doc(user.uid)
                                .collection('userStocks')
                                .doc(doc.id)
                                .update({
                                    shares: totalShares,
                                    averageCost: newAveragePrice,
                                })
                            });
                        } 
                        else {
                            let totalValue = 0;
                            db.collection('users')
                            .doc(user.uid)
                            .collection('userStocks')
                            .add({
                                ticker: props.name,
                                shares: quantity, 
                                averageCost: props.price
                            });
                            totalValue += quantity * props.price;
                            // updatePortfolio(totalCost)
                    
                        }
                    })
                } else {
                    alert('Insufficient buying power.')
                }
            }
        })
    } else {
        alert('Invalid input. Please enter a valid quantity.');
    }
  }

  const sellStock = (quantity) => {
    quantity = parseInt(quantity);
    if(!isNaN(quantity) && quantity > 0) {
      const currentPrice = props.price
      db.collection('users')
        .doc(user?.uid)
        .collection('userStocks')
        .where('ticker', '==', props.name)
        .get()
        .then((querySnapshot) => {
          let averageCost = 0;
          let totalShares = 0
          let shareProfit = 0;
          let totalProfit = 0;
          querySnapshot.forEach((doc) => {
            const shares = doc.data().shares;
            averageCost = doc.data().averageCost;
            totalShares += shares;
          })
          shareProfit = props.price - averageCost;
          totalProfit = shareProfit * quantity;
          console.log(totalProfit)

          if(totalShares >= quantity) {
            if(totalShares >= quantity) {
              const totalSell = (quantity * shareProfit) + (quantity * averageCost);
              db.collection('users')
                .doc(user?.uid)
                .collection('userData')
                .doc('buyingPower')
                .get()
                .then((doc) => {
                  if (doc.exists) {
                    const currentBuyingPower = doc.data().amount;
                    updateBuyingPower(currentBuyingPower + totalSell)
                  }
                })
                db.collection('users')
                  .doc(user?.uid)
                  .collection('userData')
                  .doc('Portfolio')
                  .get()
                  .then((doc) => {
                    if (doc.exists) {
                      const existingTotalSoldProfit = doc.data().totalSoldProfit || 0;

                      const updatedTotalSoldProfit = existingTotalSoldProfit + totalProfit;

                      // Update the "totalSoldProfit" field with the new calculated value
                      db.collection('users')
                        .doc(user?.uid)
                        .collection('userData')
                        .doc('Portfolio')
                        .update({
                          totalSoldProfit: updatedTotalSoldProfit,
                        })
                        .then(() => {
                          console.log("Portfolio updated with total sold profit.");
                        })
                        .catch((error) => {
                          console.error("Error updating portfolio with total sold profit:", error);
                        });
                    } else {
                      db.collection('users')
                        .doc(user?.uid)
                        .collection('userData')
                        .doc('Portfolio')
                        .set({
                          totalSoldProfit: totalProfit,
                        })
                        .then(() => {
                          console.log("Portfolio document created with total sold profit.");
                        })
                        .catch((error) => {
                          console.error("Error creating portfolio document:", error);
                        });
                    }
                  })
                  .catch((error) => {
                    console.error("Error fetching portfolio document:", error);
                  });
            
              if(totalShares === quantity) {
                querySnapshot.forEach((doc) => {
                  doc.ref.delete();
                })
              }
              else {
                const remainingShares = totalShares - quantity;
                
                querySnapshot.forEach((doc) => {
                  doc.ref.update({
                    shares: remainingShares,
                  })
                })
              }
            }
          }
          else {
            alert('You do not have enough shares to sell')
          }
        })
        .catch((error) => {
          console.error('error selling shares: ', error)
        })
    }
    else {
      alert('Invalid Input. Please enter a valid Quantity')
    }
  }

  const percentColor = percentage < 0 ? 'red' : '#81c995';

  const handleRowClick = () => {
      // If the clicked stock is different or no stock is selected, open the pop-up for the clicked stock
      setSelectedStock({
        name: props.name,
        price: props.price,
        openPrice: props.openPrice,
        percentage: percentage,
        percentageColor: percentColor,
        currentProfit: profit,
      });
      setShowPop(true)
  };


  return (
    <div className='row' onClick={handleRowClick}>
        <div className='row__intro'>
            <h1>{props.name}</h1>
            <p>{props.shares &&
                (props.shares + " shares")    
            }</p>
        </div>
        <div className='row__chart'>
          <span> </span>
        </div>
        <div className='row__numbers'>
            <p className='row__price'>{props.price}</p>
            <p className='row__percentage' style={{color:percentColor}}>{Number(percentage).toFixed(2)}%</p>
        </div>
        {showPop && selectedStock && (
            <StockPop 
                stockData={selectedStock}
                onBuyStock={buyStock}
                onSellStock={sellStock}
                showPop={true}
                setShowPop={setShowPop}
                setSelectedStock={setSelectedStock}
            />
        )}
    </div>
  )
}

export default StatsRow