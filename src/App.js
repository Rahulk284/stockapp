import React, { useEffect } from 'react';
import './App.css';
import Header from './Header';
import Login from './Login'
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { auth } from './firebase'
import {useStateValue } from './StateProvider'
import AppComp from './AppComp';



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
      <Router basename='/stockapp'>
        <div className="app">
            <Routes>
                <Route exact path="/Portfolio" element={[<Header/>, <h1>I am a portfolio page</h1>]}/>
                <Route exact path="/History" element={[<Header/>, <h1>I am a history page</h1>]}/>
                <Route exact path="/home" element={[<Header/>, <AppComp/>]}/>
                <Route exact path="/" element={[<Login/>]} />
            </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;