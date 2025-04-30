import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap CSS
import "../Styling/AppliedJob.css"; // Import your custom CSS

function AppliedJob() {

    // Placeholder data for applied jobs (to be replaced with backend data)
    const [appliedJobs, setAppliedJobs] = useState([
        { id: 1, company: "Google", date: "2025-04-01", status: "Pending" },
        { id: 2, company: "Microsoft", date: "2025-03-28", status: "Interview Scheduled" },
        { id: 3, company: "Amazon", date: "2025-03-25", status: "Rejected" },
        { id: 4, company: "Amazon", date: "2025-03-25", status: "Rejected" },
        { id: 5, company: "Amazon", date: "2025-03-25", status: "Rejected" },
        { id: 6, company: "Amazon", date: "2025-03-25", status: "Rejected" },
        { id: 1, company: "Google", date: "2025-04-01", status: "Pending" },
        { id: 2, company: "Microsoft", date: "2025-03-28", status: "Interview Scheduled" },
        { id: 3, company: "Amazon", date: "2025-03-25", status: "Rejected" },
        { id: 4, company: "Amazon", date: "2025-03-25", status: "Rejected" },
        { id: 5, company: "Amazon", date: "2025-03-25", status: "Rejected" },
        { id: 6, company: "Amazon", date: "2025-03-25", status: "Rejected" },
    ]);

    const handleStatusChange = (id, newStatus) => {
        setAppliedJobs((prevJobs) =>
            prevJobs.map((job) =>
                job.id === id ? { ...job, status: newStatus } : job
            )
        );
    };

    return (
        <div className="AppliedJob">
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-10 col-sm-12">
                        <div className="card shadow-sm p-4 applied-jobs-history">
                            <h2 className="applied-jobs-heading text-center">Applied Jobs History</h2>
                            <table className="table table-bordered table-hover mt-2 applied-jobs-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>Company</th>
                                        <th>Date Applied</th>
                                        <th>Status</th>
                                        <th>Update Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appliedJobs.map((job) => (
                                        <tr key={job.id}>
                                            <td>{job.company}</td>
                                            <td>{job.date}</td>
                                            <td>{job.status}</td>
                                            <td>
                                                <select
                                                    value={job.status}
                                                    className="form-select"
                                                    onChange={(e) =>
                                                        handleStatusChange(job.id, e.target.value)
                                                    }
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Interview Scheduled">Interview Scheduled</option>
                                                    <option value="Accepted">Accepted</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppliedJob;