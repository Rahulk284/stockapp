import React, { useEffect, useState } from 'react'
import { auth, db } from './firebase'
import './Portfolio.css'
 
function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [profit, setProfit] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
        db.collection('users')
        .doc(user.uid)
        .collection('userData')
        .doc('Portfolio')
        .onSnapshot(doc => {
          if (doc.exists) {
            let currentProfit = doc.data().currentProfit
            let totalSoldProfit = doc.data().totalSoldProfit
            setProfit(currentProfit)
            if (totalSoldProfit) {
              setProfit(currentProfit + totalSoldProfit)
            }
            setPortfolio(doc.data().amount);
          } else {
            console.log('No Portfolio document found.');
          }
        });
    }
  }, [user]);


  return (
    <div className="portfolio">
        {portfolio !== null ? (<h1>${portfolio.toFixed(2)}</h1>) : (<h1>Loading...</h1>)}
        <div className='portfolio__stats'>                
            {profit !== null && profit !== undefined ? (profit >= 0  ? <p style={{color: "#81c995"}}>+{profit.toFixed(2) }</p> : <p style={{color: 'red'}}>{profit.toFixed(2)}</p>) : (<p>0.00</p>)}
            {profit !== null && profit !== undefined ? (profit >= 0  ? <p style={{color: "#81c995"}}>(+{((profit/10000) * 100).toFixed(2)}%)</p> : <p style={{color: "red"}}> ({((profit/10000) * 100).toFixed(2)}%)</p>) : (<p>(0.00%)</p>)}
        </div>
    </div>
  )
}

export default Portfolio;
