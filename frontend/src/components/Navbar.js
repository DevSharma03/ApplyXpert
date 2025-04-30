import React, { useState } from 'react';
import Logo from '../assets/Logo.png';
import '../Styling/Navbar.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo-title">
                <img src={Logo} alt="logo" className="navbar-logo"/>
            </div>
            <div className="navbar-hamburger" onClick={toggleMenu}>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
            </div>
            <ul className={`navbar-links ${isMenuOpen ? 'navbar-links-active' : ''}`}>
                <li><a href="/">Home</a></li>
                <li><a href="dashboard">Dashboard</a></li>
                <li><a href="pages/login.html">Login</a></li>
            </ul>
        </nav>
    );
};

export default Navbar;
