import React, { useEffect, useState } from 'react'
import './NewsFeed.css'
import LineGraph from './LineGraph'
import BuyingPower from './BuyingPower';
import Portfolio from './Portfolio';
import { db, auth } from './firebase'


function NewsFeed() {
  const [userData, setUserData] = useState({
    labels: [],
    datasets: [
      {
        label: "Portfolio Amount",
        data: [],
        fill: 'rgb(75,192,192)',
        type: 'line',
        backgroundColor: "black",
        borderColor: "#5AC53B",
        borderWidth: 2,
        pointBorderColor: 'rgba(0, 0, 0, 0)',
        pointBackgroundColor: 'rgba(0, 0, 0, 0)',
        pointHoverBackgroundColor: '#5AC53B',
        pointHoverBorderColor: '#000000',
        pointHoverBorderWidth: 1,
        pointHoverRadius: 6,
      },
    ]
  });
  
  

  useEffect(() => {
    let timer = setTimeout(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          fetchPortfolioHistory(user);
        } else {
          console.log('User is not authenticated.');
        }
      });
      return () => {
        unsubscribe();
        clearTimeout(timer);
      };
    }, 1400); // Wait 4 seconds before fetching data

    return () => clearTimeout(timer); // Clean up the timer in case the component unmounts before the timeout is reached
  }, []);

  const fetchPortfolioHistory = (user) => {
    db.collection('users')
      .doc(user.uid)
      .collection('userData')
      .doc('portfolioHistory')
      .get()
      .then((doc) => {
        if (doc.exists) {
          const portfolioHistoryData = doc.data().data;
          const chartLabels = [];
          const chartValues = [];

          for (let i = 0; i < portfolioHistoryData.length; i++) {
            const data = portfolioHistoryData[i];
            const currentValue = data.portfolioValue;

            if (i === 0 || currentValue !== portfolioHistoryData[i - 1].portfolioValue) {
              chartLabels.push(data.date);
              chartValues.push(currentValue);
            }
          }

          const mostRecentPortfolioValue = chartValues[chartValues.length - 1];

          const backgroundColor = mostRecentPortfolioValue >= 10000 ? '#5AC53B' : 'red';
          const borderColor = mostRecentPortfolioValue >= 10000 ? '#5AC53B' : 'red';
          const pointHoverBackgroundColor = mostRecentPortfolioValue >= 10000 ? '#5AC53B' : 'red';

          setUserData((prevChartData) => ({
            ...prevChartData,
            labels: chartLabels,
            datasets: [
              {
                ...prevChartData.datasets[0],
                data: chartValues,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                pointHoverBackgroundColor: pointHoverBackgroundColor,
              },
            ],
          }));
        }
      })
      .catch((error) => {
        console.error('Error fetching portfolio history:', error);
      });
  };
  

  return (
    <div className='newsfeed'>
        <div className='newsfeed__container'>
          <div className='newsfeed__chartSection'>
            <div className='newsfeed__portfolio'>
              <Portfolio />
            </div>
            <div className='newsfeed__chart'>
              <LineGraph chartData={userData}/>
            </div>
          </div>
          <div className='newsfeed__buying__section'>
            <BuyingPower />
          </div>
        </div>
    </div>
  )
}

export default NewsFeed