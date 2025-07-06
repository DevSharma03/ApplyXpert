import React from "react";
import '../Styling/Dashboard.css';

function DashboardComponent() {
    return (
        <>
            <div className="dashboard-content">
                <h1 className="dashboard-heading">Welcome to your Dashboard</h1>
                <p className="dashboard-text">Manage your profile, applications, and generate documents with ease.</p>
                <div className="dashboard-cards">
                    <div className="dashboard-card">
                        <h2>Your Profile</h2>
                        <p>View and update your personal details.</p>
                    </div>
                    <div className="dashboard-card">
                        <h2>Job Applications</h2>
                        <p>Check your submitted applications and their statuses.</p>
                    </div>
                    <div className="dashboard-card">
                        <h2>Generate Documents</h2>
                        <p>Auto-generate resumes and cover letters tailored to jobs.</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default DashboardComponent;