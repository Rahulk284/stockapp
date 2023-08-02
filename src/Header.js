import React from 'react'
import Logo from './robinhood.svg'
import './Header.css'
import SearchIcon from '@mui/icons-material/Search';
import { Link } from "react-router-dom";
import { useStateValue } from './StateProvider'
import { auth } from './firebase';

function Header() {
  const [{user}] = useStateValue();

  const handleAuthentication = () => {
    if (user) {
      auth.signOut();
    }
  }

  return (
      <div className='header__wrapper'>
        <Link to="/">
          <img 
            className='header__logo'
            src={Logo} 
            alt="logo"
          />
        </Link>
        

        {/* <div className='header__search'>
          <input
            className='header__searchInput'
            type="text"
          />
          <SearchIcon
          className='header__searchIcon'/>
        </div> */}

        <div className='header__nav'>
          
          <div className='header__option'>
            <span className='header__optionReg'>Portfolio</span>
          </div>

          <div className='header__option'>
            <span className='header__optionReg'>History</span>
          </div>
          <Link to={'/'}>
            <div onClick={handleAuthentication} className='header__option'>
              <span className='header__optionOne'>{user ? `Hello ${user.email}` : 'Hello Guest'}</span>
              <span className='header__optionTwo'>{user ? 'Sign Out' : 'Sign In'}</span>
            </div>
          </Link>

        </div>

      </div>
  )
}

export default Header