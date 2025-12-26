import React, { useEffect } from 'react';
import './App.css';
import Header from './Header';
import Login from './Login'
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { auth } from './firebase'
import {useStateValue } from './StateProvider'
import AppComp from './AppComp';
import StockDetail from './StockDetail';
import History from './History';

function App() {

  const [, dispatch] = useStateValue();

  useEffect(() => {
    //runs when the app loads
    auth.onAuthStateChanged(authUser => {
      console.log('THE USER IS ', authUser);
      if(authUser) {
        dispatch({
          type: 'SET_USER',
          user: authUser,
        })
      } 
      else if (!authUser) {
        dispatch({
          type: 'SET_USER',
          user: null,
        })
      }
    })
  }, [dispatch])

  return (
    <>
      <Router>
        <div className="app">
            <Routes basename="/stockapp">
                <Route exact path="/History" element={[<Header/>, <History/>]}/>
                <Route exact path="/home" element={[<Header/>, <AppComp/>]}/>
                <Route exact path="/stock/:ticker" element={[<Header/>, <StockDetail/>]}/>
                <Route exact path="/" element={[<Login/>]} />
            </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;