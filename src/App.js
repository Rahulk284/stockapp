import React, { useEffect } from 'react';
import './App.css';
import Header from './Header';
import Login from './Login'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
      <Router>
        <div className="app">
            <Routes>
                <Route path="/Portfolio" element={[<Header/>, <h1>I am a portfolio page</h1>]}/>
                <Route path="/History" element={[<Header/>, <h1>I am a history page</h1>]}/>
                <Route path="/home" element={[<Header/>, <AppComp/>]}/>
                <Route path="/" element={[<Login/>]} />
            </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;


/* <div className='app__wrapper'>
                    <Header /> 
                    <div className='app__body'>
                      <div className='app_container'>
                        <Stats />
                        <NewsFeed/>
                      </div>
                    </div>
                </div> */