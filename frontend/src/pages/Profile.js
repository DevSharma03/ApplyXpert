import React, { useState, useEffect } from "react";
import "../Styling/Profile.css";

function Profile() {
    const [user, setUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const userData = JSON.parse(localStorage.getItem("user"));
            setUser(userData);
            setFormData(userData);
        }
    }, []);

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSave = () => {
        setUser(formData);
        localStorage.setItem("user", JSON.stringify(formData));
        setEditMode(false);
    };

    const renderField = (label, name) => (
        <div className="profile-field">
            <span className="profile-label">{label}:</span>
            {editMode ? (
                <input
                    type="text"
                    name={name}
                    value={formData[name] || ""}
                    onChange={handleChange}
                    className="profile-input"
                />
            ) : (
                <span className="profile-value">{user?.[name] || "N/A"}</span>
            )}
        </div>
    );

    return (
        <div className="Profile">
            <div className="profile-container">
                <div className="profile-after-login">
                    <h2 className="profile-heading pb-3">
                        {user?.fullname || "User"}'s Profile
                    </h2>
                    <div className="profile-text-container">
                        {renderField("Name", "fullname")}
                        {renderField("Username", "username")}
                        {renderField("Email", "email")}
                        {renderField("Phone", "phone")}
                        {renderField("Location", "location")}
                        {renderField("Experience", "experience")}
                        {renderField("Experience", "experience")}
                        {renderField("Skills", "skills")}
                        {renderField("Education", "education")}
                        {renderField("Resume", "resume")}
                        {renderField("Portfolio", "portfolio")}
                        {renderField("LinkedIn", "linkedin")}
                        {renderField("GitHub", "github")}
                        {renderField("About", "about")}
                    </div>

                    <div className="profile-buttons">
                        {editMode ? (
                            <>
                                <button className="profile-button" onClick={handleSave}>
                                    Save
                                </button>
                                <button className="profile-button" onClick={handleEditToggle}>
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button className="profile-button" onClick={handleEditToggle}>
                                Edit Profile
                            </button>
                        )}
                        <button className="profile-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;

