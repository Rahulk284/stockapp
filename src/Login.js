import React, { useState } from 'react';
import Logo from './icons8-robinhood.svg';
import './Login.css'
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from './firebase';


function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = e => {
    e.preventDefault();

    //firebase
    auth
        .signInWithEmailAndPassword(email, password)
        .then(auth => {
          navigate('/home')
        })
        .catch(error => alert(error.message))

  }

  const register = e => {
    e.preventDefault();
    
    auth
        .createUserWithEmailAndPassword(email, password)
        .then((auth) => {
          console.log(auth);//if success
          if (auth) {
            db.collection('users')
              .doc(auth.user.uid)
              .collection('userData')
              .doc('buyingPower')
              .set({
                amount: 10000
              });
            db.collection('users')
              .doc(auth.user.uid)
              .collection('userData')
              .doc('Portfolio')
              .set({
                amount: 10000
              });
            navigate('/home')
          }
        })
        .catch(error => alert(error.message))

  }

  return (
    <div className='login'>
        <Link to="/">
            <img
                className='login__logo'
                src={Logo}
                alt='loginLogo'
            />
        </Link>
        <div className='login__container'>
          <h1>Sign-in</h1>
          
          <form>
            <h5>E-mail</h5>
            <input type='text' value={email} 
            onChange= {e => setEmail(e.target.value)}
            />

            <h5>Password</h5>
            <input type='password' value={password} 
            onChange={e => setPassword(e.target.value)}
            />

            <button type='submit' onClick={signIn} className='login__signInButton'>Sign In</button>
          </form>

          <p>
            By continuing, you agree to the 
            ROBINHOOD CLONE User Account Agreement and 
            Privacy Policy.
          </p>

          <button onClick={register} className='login__registerButton'>Create your Stock Trading Account</button>
        </div>
    </div>
  )
}

export default Login