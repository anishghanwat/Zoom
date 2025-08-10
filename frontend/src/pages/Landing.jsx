import React from 'react';
import { Link } from 'react-router-dom';
import "../App.css"; // Importing global styles

/**
 * Landing Component
 * -----------------
 * This is the home/landing page of the app.
 * It contains a navigation bar and a hero section
 * encouraging users to start using "Apna Video Call".
 */
function Landing() {
    return (
        <div className='LandingContainer'>

            {/* Navigation Bar */}
            <nav>
                {/* App Logo / Header */}
                <div className='navHeader'>
                    <h2>Apna Video Call</h2>
                </div>

                {/* Navigation Links */}
                <div className='navList'>
                    {/* Using Link instead of <p> for better accessibility and SEO */}
                    <Link to="/guest">Join as a Guest</Link>
                    <Link to="/register">Register</Link>
                    <Link to="/login" className="loginBtn">Login</Link>
                </div>
            </nav>

            {/* Main Hero Section */}
            <div className='LandingMainContainer'>

                {/* Left Content: Headline, description, and CTA */}
                <div>
                    <h1>
                        <span style={{ color: "#ff9839" }}>Connect</span> with your loved ones
                    </h1>
                    <p>Cover a distance by Apna Video Call</p>

                    {/* Call-to-Action button */}
                    <Link to='/auth' className='ctaButton'>Get Started</Link>
                </div>

                {/* Right Content: App preview image */}
                <div>
                    <img
                        src='/mobile.png'
                        alt='Video calling app preview on a mobile screen'
                    />
                </div>
            </div>
        </div>
    );
}

export default Landing;
