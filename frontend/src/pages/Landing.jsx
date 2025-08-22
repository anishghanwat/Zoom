import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'
import { Typography, Box, Container } from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <Box display="flex" alignItems="center" gap={1}>
                        <VideoCallIcon sx={{ fontSize: 32, color: 'white' }} />
                        <h2>Meetly</h2>
                    </Box>
                </div>
                <div className='navlist'>
                    <p onClick={() => router("/aljk23")}>Join as Guest</p>
                    <p onClick={() => router("/auth")}>Register</p>
                    <div onClick={() => router("/auth")} role='button'>
                        <p>Login</p>
                    </div>
                </div>
            </nav>

            <Container maxWidth="lg" className="landingMainContainer">
                <div className="slideInLeft">
                    <Typography variant="h1" component="h1" gutterBottom>
                        <span>Connect</span> with your loved Ones
                    </Typography>

                    <Typography variant="h5" component="p" sx={{ mb: 3, opacity: 0.9 }}>
                        Cover a distance by Meetly
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 4, opacity: 0.8, lineHeight: 1.6 }}>
                        Experience high-quality video conferencing with crystal-clear audio,
                        HD video, and seamless screen sharing. Perfect for work, education,
                        and staying connected with family and friends.
                    </Typography>

                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>

                    {/* Feature Highlights */}
                    <Box sx={{ mt: 6, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.8 }}>
                            <GroupIcon sx={{ fontSize: 20 }} />
                            <Typography variant="body2">Multi-participant</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.8 }}>
                            <SecurityIcon sx={{ fontSize: 20 }} />
                            <Typography variant="body2">Secure & Private</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.8 }}>
                            <SpeedIcon sx={{ fontSize: 20 }} />
                            <Typography variant="body2">High Performance</Typography>
                        </Box>
                    </Box>
                </div>

                <div className="slideInRight">
                    <img
                        src="/mobile.png"
                        alt="Video Call Illustration"
                        style={{
                            filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    />
                </div>
            </Container>
        </div>
    )
}