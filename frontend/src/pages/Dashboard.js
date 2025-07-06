import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import '../Styling/Dashboard.css';
import DashboardNavbar from "../components/Dashboard-Navbar";
import DashboardComponent from "../components/Dashboard_Component";
import Profile from './Profile';
import AppliedJob from './AppliedJob';
import Generate from "./ATS_Score";
import AutoApplyJob from "./AutoApplyJob";

function Dashboard() {

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // Simulate login check
            setIsLoggedIn(true);
        }
    }, []);

    return (
        <div className="dashboard-container">
            {!isLoggedIn ? (
                <div className="dashboard-main">
                    <div className="dashboard-withoutlogin-card text-center">
                        <h2 className="dashboard-heading">Login Required</h2>
                        <p className="dashboard-text">
                            Please log in to access your applied jobs. Track your applications, manage your progress, and stay organized with <strong>ApplyXpert</strong>.
                        </p>
                        <div className="text-center">
                            <a href="/pages/login.html" className="applyjob-button">
                                Login Now
                            </a>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="row dashboard-row m-0">
                    <DashboardNavbar />

                    <main className="col-md-10 dashboard-main p-0">
                        <Routes>
                            <Route path="profile" element={<Profile />} />
                            <Route path="applyJob" element={<AutoApplyJob />} />
                            <Route path="history" element={<AppliedJob />} />
                            <Route path="atsScore" element={<Generate />} />
                            <Route path="dashboard" element={<DashboardComponent />} />
                        </Routes>
                    </main>
                </div>
            )}
        </div>
    );
}

export default Dashboard;



