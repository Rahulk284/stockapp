import React, { useState, useEffect } from 'react'
import './Stats.css'
import axios from 'axios';
import StatsRow from './StatsRow';
import {db, auth} from './firebase'

const TOKEN = "cj0ofe9r01qgc2gj6vb0cj0ofe9r01qgc2gj6vbg";
const BASE_URL = "https://finnhub.io/api/v1/quote"


function Stats() {

    const[stockData, setStockData] = useState([])
    const[myStocks, setmyStocks] = useState([])
    const user = auth.currentUser;

    const getMyStocks = () => {
        if (user) {
          db.collection('users')
            .doc(user.uid)
            .collection('userStocks')
            .onSnapshot(snapshot => {
              let promises = [];
              let tempData = [];
              snapshot.docs.forEach(doc => {
                const promise = getStockData(doc.data().ticker)
                  .then(res => {
                    tempData.push({
                      id: doc.id,
                      data: doc.data(),
                      info: res.data
                    });
                  });
                promises.push(promise);
              });
              Promise.all(promises).then(() => {
                setmyStocks(tempData);
              });
            });
        }
      };
      

    const getStockData = async (stock) => {
        const cachedStockData = localStorage.getItem(stock);
        if (cachedStockData) {
          const { timestamp, data } = JSON.parse(cachedStockData);
          // Check if one minute has passed since the last API call
          if (Date.now() - timestamp < 60 * 1000) {
            return { data };
          }
        }
      
        try {
          const response = await axios.get(`${BASE_URL}?symbol=${stock}&token=${TOKEN}`);
          const newStockData = {
            timestamp: Date.now(),
            data: response.data,
          };
          localStorage.setItem(stock, JSON.stringify(newStockData));
          return response;
        } catch (error) {
          console.error("Error", error.message);
          throw error;
        }
      };
      

      useEffect(() => {
        let tempStocksData = [];
        const stocksList = ["AAPL", "AMZN", "GOOGL", "NVDA", "IBM", "JPM", "BAC", "ORCL", "CAT", "NFLX", "MSFT", "TSLA", "META", "BABA", "UBER", "SBUX", "RIVN", "VOO", "AMC", "GME", "NKE"];
        let promises = [];
      
        getMyStocks();
      
        stocksList.forEach((stock) => {
          promises.push(
            getStockData(stock).then((res) => {
              tempStocksData.push({
                name: stock,
                ...res.data,
              });
            })
          );
        });
      
        Promise.all(promises)
          .then(() => {
            console.log(tempStocksData);
            setStockData(tempStocksData);
          })
          .catch((error) => {
            console.error("Error fetching stock data:", error);
          });
      }, [user?.uid]);
      


  return (
    <div className='stats'>
        <div  className='stats__container'>
            <div className='stats__header'>
                <p>My Stocks</p>
            </div>
            <div className='stats__content'>
                <div className='stats__rows'>
                    {myStocks.map((stock) => (
                        <StatsRow
                            key={stock.data.ticker}
                            name={stock.data.ticker}
                            openPrice={stock.info.o}
                            shares={stock.data.shares}
                            price={stock.info.c}
                            userStocks={myStocks}
                            stocks={stockData}
                        />
                    ))}
                </div>
            </div>
            <div className='stats__header stats__lists'>
                <p>Available Stocks</p>
            </div>
            <div className='stats__content'>
                <div className='stats__rows'>
                    {stockData.map((stock) => (
                        <StatsRow
                            key={stock.name}
                            name={stock.name}
                            openPrice={stock.o}
                            price={stock.c}
                        />
                    ))}
                </div>
            </div>
        </div>

    </div>
  )
}

export default Stats


// import React, { useState, useEffect } from 'react'
// import './Stats.css'
// import axios from 'axios';
// import StatsRow from './StatsRow';
// import {db, auth} from './firebase'

// const TOKEN = "cj0o5l9r01qgc2gj6r6gcj0o5l9r01qgc2gj6r70";
// const BASE_URL = "https://finnhub.io/api/v1/quote"


// function Stats() {

//     const[stockData, setStockData] = useState([])
//     const[myStocks, setmyStocks] = useState([])
//     const user = auth.currentUser;

//     const getMyStocks = () => {
//         if (user) {
//             db.collection('users')
//             .doc(user.uid)
//             .collection('userStocks')
//             .onSnapshot(snapshot => {
//               let promises = [];
//               let tempData = [];
//               snapshot.docs.forEach(doc => {
//                 const promise = getStockData(doc.data().ticker)
//                   .then(res => {
//                     tempData.push({
//                       id: doc.id,
//                       data: doc.data(),
//                       info: res.data
//                     });
//                   });
//                 promises.push(promise);
//               });
//               Promise.all(promises).then(() => {
//                 setmyStocks(tempData);
//               });
//             });
//         }
//     };

//     const getStockData = (stock) => {
//         return axios
//             .get(`${BASE_URL}?symbol=${stock}&token=${TOKEN}`)
//             .catch((error) => {
//                 console.error("Error", error.message);
//             })
//     }

//     useEffect(() => {
//     let tempStocksData = [];
//     const stocksList = ["AAPL", "MSFT", "TSLA", "META", "BABA", "UBER", "DIS", "SBUX", "RIVN", "VOO"];
//     let promises = [];
//     getMyStocks();
//     stocksList.forEach((stock) => {
//       promises.push(
//         getStockData(stock).then((res) => {
//           tempStocksData.push({
//             name: stock,
//             ...res.data
//           });
//         })
//       );
//     });

//     Promise.all(promises)
//       .then(() => {
//         console.log(tempStocksData);
//         setStockData(tempStocksData);
//       })
//       .catch((error) => {
//         console.error('Error fetching stock data:', error);
//       });
//   }, [myStocks.price, user?.uid]);


//   return (
//     <div className='stats'>
//         <div  className='stats__container'>
//             <div className='stats__header'>
//                 <p>My Stocks</p>
//             </div>
//             <div className='stats__content'>
//                 <div className='stats__rows'>
//                     {myStocks.map((stock) => (
//                         <StatsRow
//                             key={stock.data.ticker}
//                             name={stock.data.ticker}
//                             openPrice={stock.info.o}
//                             shares={stock.data.shares}
//                             price={stock.info.c}
//                             userStocks={myStocks}
//                             stocks={stockData}
//                         />
//                     ))}
//                 </div>
//             </div>
//             <div className='stats__header'>
//                 <p>Lists</p>
//             </div>
//             <div className='stats__content'>
//                 <div className='stats__rows'>
//                     {stockData.map((stock) => (
//                         <StatsRow
//                             key={stock.name}
//                             name={stock.name}
//                             openPrice={stock.o}
//                             price={stock.c}
//                         />
//                     ))}
//                 </div>
//             </div>
//         </div>

//     </div>
//   )
// }

// export default Stats