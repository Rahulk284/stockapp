import React, { useEffect, useState } from 'react'
import { auth, db } from './firebase'
import './BuyingPower.css'
 
function BuyingPower() {
  const [buyingPower, setBuyingPower] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
        db.collection('users')
        .doc(user.uid)
        .collection('userData')
        .doc('buyingPower')
        .onSnapshot(doc => {
          if (doc.exists) {
            setBuyingPower(doc.data().amount);
          } else {
            console.log('No buying power document found.');
          }
        });
    }   
  }, [user]);

  const updateBuyingPower = (amount) => {
    db.collection('users')
      .doc(user.uid)
      .collection('userData')
      .doc('buyingPower')
      .update({ amount })
      .then(() => {
        setBuyingPower(amount); 
      })
  }

  return (
    <div className="buying__power">
      <h2>Buying Power</h2>
      {buyingPower !== null ? (<h3>${buyingPower.toFixed(2)}</h3>) : (<h3>Loading...</h3>)}
    </div>
  )
}

export default BuyingPower;
