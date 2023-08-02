import React from 'react'
import Stats from './Stats'
import NewsFeed from './NewsFeed'
import './AppComp.css'

function AppComp() {
  return (
    <div>
        <div className="app__comp">
            <div className="app__body">
                <div className="app__container">
                    <NewsFeed />
                    <div className='app__spacing'></div>
                    <Stats />
                </div>
            </div>
            </div>
        </div>
  )
}

export default AppComp