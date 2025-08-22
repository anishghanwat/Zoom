import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, TextField, Paper, Typography, Box, Container } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;

        setIsJoining(true);
        try {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`);
        } catch (error) {
            console.error('Error joining meeting:', error);
        } finally {
            setIsJoining(false);
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && meetingCode.trim()) {
            handleJoinVideoCall();
        }
    }

    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <VideoCallIcon sx={{ fontSize: 32, color: 'var(--primary-color)', mr: 1 }} />
                    <h2>Meetly</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <Button
                        className="navButton"
                        onClick={() => navigate("/history")}
                        startIcon={<RestoreIcon />}
                        variant="outlined"
                        color="primary"
                    >
                        History
                    </Button>
                    <Button
                        className="logoutBtn"
                        onClick={() => {
                            localStorage.removeItem("token")
                            navigate("/auth")
                        }}
                        startIcon={<LogoutIcon />}
                        variant="contained"
                        color="error"
                    >
                        Logout
                    </Button>
                </div>
            </div>

            <Container maxWidth="lg" className="meetContainer">
                <div className="leftPanel slideInLeft">
                    <Typography variant="h2" component="h2" gutterBottom>
                        Providing Quality Video Call Just Like Quality Education
                    </Typography>

                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.6 }}>
                        Connect with your team, students, or loved ones through our high-quality video conferencing platform.
                        Experience crystal-clear audio, HD video, and seamless screen sharing.
                    </Typography>

                    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.9)' }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'var(--primary-color)' }}>
                            Join a Meeting
                        </Typography>

                        <div className="meetingForm">
                            <TextField
                                fullWidth
                                label="Meeting Code"
                                variant="outlined"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter meeting code to join"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: 'var(--primary-color)',
                                        },
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleJoinVideoCall}
                                disabled={!meetingCode.trim() || isJoining}
                                startIcon={isJoining ? <div className="loading" /> : <VideoCallIcon />}
                                sx={{
                                    minWidth: 120,
                                    height: 56,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary-color))',
                                        transform: 'translateY(-2px)',
                                        boxShadow: 'var(--shadow-lg)',
                                    },
                                    '&:disabled': {
                                        background: 'var(--text-light)',
                                        transform: 'none',
                                        boxShadow: 'none',
                                    }
                                }}
                            >
                                {isJoining ? 'Joining...' : 'Join Meeting'}
                            </Button>
                        </div>

                        {meetingCode.trim() && (
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                Press Enter to join quickly
                            </Typography>
                        )}
                    </Paper>

                    <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Paper elevation={2} sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
                            <Typography variant="h6" color="primary" gutterBottom>
                                🎥 HD Video
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Crystal clear video quality for better communication
                            </Typography>
                        </Paper>
                        <Paper elevation={2} sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
                            <Typography variant="h6" color="primary" gutterBottom>
                                🎤 Clear Audio
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Noise-canceling audio for distraction-free calls
                            </Typography>
                        </Paper>
                        <Paper elevation={2} sx={{ p: 2, borderRadius: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
                            <Typography variant="h6" color="primary" gutterBottom>
                                📱 Screen Share
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Share your screen for presentations and collaboration
                            </Typography>
                        </Paper>
                    </Box>
                </div>

                <div className="rightPanel slideInRight">
                    <img
                        src="/video-illustration.svg"
                        alt="Video Call Illustration"
                        style={{
                            filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.15))',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    />
                </div>
            </Container>
        </>
    )
}

export default withAuth(HomeComponent)