import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS
import "../Styling/AppliedJob.css"; // Import your custom CSS

function AppliedJob() {
    const [selectedCV, setSelectedCV] = useState(null);

    const handleCVSelection = (event) => {
        setSelectedCV(event.target.files[0]);
    };

    return (
        <div className="AppliedJob">
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-10 col-sm-12">
                        <div>
                            <div className="card shadow-sm p-4 mb-4 applyjob-container-afterlogin">
                                <h2 className="applyjob-container-afterlogin-heading">Apply For Jobs & Internships</h2>
                                <form className="applyjob-container-form">
                                    <div className="row mb-3">
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="jobRole" className="form-label mt-2">Job Role</label>
                                            <input
                                                type="text"
                                                id="jobRole"
                                                name="jobRole"
                                                className="form-control"
                                                placeholder="Enter job role"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="city" className="form-label mt-2">City</label>
                                            <input
                                                type="text"
                                                id="city"
                                                name="city"
                                                className="form-control"
                                                placeholder="Enter city"
                                            />
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="country" className="form-label mt-2">Country</label>
                                            <input
                                                type="text"
                                                id="country"
                                                name="country"
                                                className="form-control"
                                                placeholder="Enter country"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="platform" className="form-label mt-2">Platform</label>
                                            <select id="platform" name="platform" className="form-select">
                                                <option value="">Select a platform</option>
                                                <option value="LinkedIn">LinkedIn</option>
                                                <option value="Indeed">Indeed</option>
                                                <option value="Glassdoor">Glassdoor</option>
                                                <option value="Monster">Monster</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="row mb-3">
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="platformLoginId" className="form-label mt-2">Platform Login ID</label>
                                            <input
                                                type="text"
                                                id="platformLoginId"
                                                name="platformLoginId"
                                                className="form-control"
                                                placeholder="Enter platform login ID"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label htmlFor="platformPassword" className="form-label mt-2">Platform Login Password</label>
                                            <input
                                                type="password"
                                                id="platformPassword"
                                                name="platformPassword"
                                                className="form-control"
                                                placeholder="Enter platform login password"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="cv" className="form-label mt-2">Select CV</label>
                                        <input
                                            type="file"
                                            id="cv"
                                            name="cv"
                                            className="form-control"
                                            onChange={handleCVSelection}
                                        />
                                        {selectedCV && <p className="mt-2">Selected CV: {selectedCV.name}</p>}
                                    </div>
                                    <button type="submit" className="applyjob-submit-button w-100">
                                        Auto Apply Job
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppliedJob;