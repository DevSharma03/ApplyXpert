import React from "react";
import HomeImg from '../assets/HomeImg.jpg';

const Home = () => {
    return (
        <div className="Home">
            <div className="home-container">
                {/* Header Section */}
                <div className="home-coontainer-header">
                    <img src={HomeImg} alt="HomeImg" width="100%" height="500px" />
                </div>

                {/* Body Section */}
                <div
                    className="home-container-body text-center flex flex-col items-center justify-center"
                    style={{
                        backgroundColor: "#F5EEDC",
                        padding: "20px",
                        height: "460px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <h1 className="text-4xl font-bold mb-4" style={{ color: "#474E68" }}>
                        Streamline Your Job Applications
                    </h1>
                    <p className="mb-6" style={{ color: "#474E68" }}>
                        Manage your job applications effortlessly with ApplyXpert. Track, apply, and succeed!
                    </p>
                    <a
                        href="pages/login.html"
                        className="bg-[#DEAA79] text-white px-6 rounded hover:scale-110 transition-all"
                        style={{
                            backgroundColor: "#DEAA79",
                            color: "white",
                            padding: "10px 20px",
                            borderRadius: "5px",
                            textDecoration: "none",
                            transition: "all 0.3s ease",
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = "#AB886D"}
                        onMouseOut={(e) => e.target.style.backgroundColor = "#DEAA79"}
                    >
                        Get Started
                    </a>
                </div>

                <style>
                    {`
        .home-feature-card{
            color: #474E68;
            background-color: #DEAA79;
        }
    `}
                </style>


                {/* Features Section */}
                <div class="home-feature-container container-fluid p-4" style={{backgroundColor: '#FFDAB3'}}>
                    <h1 class="text-4xl fw-bold text-center mb-5 mt-2" style={{color: "#474E68"}}>
                        Why Choose ApplyXpert?
                    </h1>
                    <div class="row g-3 justify-content-center">
                        <div class="col-md-4 col-sm-6 col-12">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body home-feature-card rounded">
                                    <h5 class="card-title">Automated Job Applications</h5>
                                    <p class="card-text">Effortlessly apply to multiple jobs with a single click, saving you hours of manual work.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 col-sm-6 col-12">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body home-feature-card rounded">
                                    <h5 class="card-title">Real-time Application Tracking</h5>
                                    <p class="card-text">Keep track of all your job applications in one place with status updates and application links.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 col-sm-6 col-12">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body home-feature-card rounded">
                                    <h5 class="card-title">User-Friendly Dashboard</h5>
                                    <p class="card-text">Manage your job search efficiently with an intuitive dashboard for easy navigation.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 col-sm-6 col-12">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body home-feature-card rounded">
                                    <h5 class="card-title">AI-Generated Cover Letters & Resumes</h5>
                                    <p class="card-text">Tailor your resume and cover letter dynamically to match each job description.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 col-sm-6 col-12">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body home-feature-card rounded">
                                    <h5 class="card-title">Apply to 30+ Jobs in an Hour</h5>
                                    <p class="card-text">Maximize your job search with bulk applications to top platforms like LinkedIn and Indeed.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 col-sm-6 col-12">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body home-feature-card rounded">
                                    <h5 class="card-title">Completely Free to Use</h5>
                                    <p class="card-text">Enjoy full access to all features at no cost—boost your job search without any fees.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
