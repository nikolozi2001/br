import React from 'react';
import '../App.scss';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <img src="/src/assets/images/sakstat-logo.svg" alt="Logo" className="logo" />
          <h1>საქართველოს სტატისტიკის ეროვნული სააგენტური</h1>
        </div>
        <nav className="nav-menu">
          <ul>
            <li><a href="/">მთავარი</a></li>
            <li><a href="/statistics">სტატისტიკა</a></li>
            <li><a href="/about">ჩვენს შესახებ</a></li>
            <li><a href="/contact">კონტაქტი</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
