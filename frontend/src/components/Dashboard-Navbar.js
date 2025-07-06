import React from 'react';
import { useNavigate } from "react-router-dom";
import Logo from '../assets/Logo.png';

function DashboardNavbar() {

    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <>
            <nav className="col-md-2 dashboard-nav">
                <img src={Logo} alt="Logo" className="dashboard-logo" />
                <ul className="dashboard-nav-list">
                    <li><a className="dashboard-nav-item" href="/profile">Profile</a></li>
                    <li><a className="dashboard-nav-item" href="/dashboard">Dashboard</a></li>
                    <li><a className="dashboard-nav-item" href="/applyJob">Find Jobs</a></li>
                    <li><a className="dashboard-nav-item" href="/history">Applied Job History</a></li>
                    <li><a className="dashboard-nav-item" href="/atsScore">ATS Score Checker</a></li>
                    <li>
                        <button className="dashboard-nav-item dashboard-logout-btn" onClick={handleLogout}>
                            Log Out
                        </button>
                    </li>
                </ul>
                <footer className="dashboard-footer">
                    <small>ApplyXpert <br /> &copy; {new Date().getFullYear()} All rights reserved</small>
                </footer>
            </nav>
        </>
    );
}

export default DashboardNavbar;