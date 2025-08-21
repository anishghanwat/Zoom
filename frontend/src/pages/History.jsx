import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Box,
    CardActions,
    CardContent,
    Button,
    Typography,
    IconButton,
    Container,
    Paper,
    Chip,
    Divider
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import "../App.css";

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");

        return `${day}/${month}/${year} at ${hours}:${minutes}`;
    };

    const handleJoinMeeting = (meetingCode) => {
        routeTo(`/${meetingCode}`);
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={2} mb={4}>
                <IconButton
                    onClick={() => routeTo("/home")}
                    color="primary"
                    sx={{
                        p: 1.5,
                        '&:hover': {
                            background: 'rgba(37, 99, 235, 0.1)',
                            transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s ease'
                    }}
                >
                    <HomeIcon />
                </IconButton>

                <Box display="flex" alignItems="center" gap={1}>
                    <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" component="h1" color="primary" fontWeight={600}>
                        Meeting History
                    </Typography>
                </Box>
            </Box>

            {/* Stats Summary */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
                <Box display="flex" alignItems="center" gap={3}>
                    <Box textAlign="center">
                        <Typography variant="h3" color="primary" fontWeight={700}>
                            {meetings.length}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Total Meetings
                        </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem />

                    <Box textAlign="center">
                        <Typography variant="h5" color="textSecondary" fontWeight={600}>
                            {meetings.length > 0 ? formatDate(meetings[0].date) : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Last Meeting
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Meetings List */}
            {meetings.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={2}>
                    {meetings.map((meeting, index) => (
                        <Card
                            key={index}
                            variant="outlined"
                            sx={{
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 'var(--shadow-lg)',
                                    borderColor: 'var(--primary-color)'
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                background: 'rgba(37, 99, 235, 0.1)',
                                                color: 'primary.main'
                                            }}
                                        >
                                            <VideoCallIcon />
                                        </Box>

                                        <Box>
                                            <Typography variant="h6" component="h3" fontWeight={600} color="primary">
                                                Meeting Code: {meeting.meetingCode}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                <AccessTimeIcon fontSize="small" color="action" />
                                                <Typography variant="body2" color="textSecondary">
                                                    {formatDate(meeting.date)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Chip
                                        label={`#${index + 1}`}
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                    />
                                </Box>
                            </CardContent>

                            <CardActions sx={{ p: 3, pt: 0 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<VideoCallIcon />}
                                    onClick={() => handleJoinMeeting(meeting.meetingCode)}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 3,
                                        py: 1
                                    }}
                                >
                                    Rejoin Meeting
                                </Button>
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            ) : (
                /* Empty State */
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '2px dashed',
                        borderColor: 'divider',
                        background: 'rgba(0, 0, 0, 0.02)'
                    }}
                >
                    <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h5" component="h3" color="textSecondary" gutterBottom>
                        No Meeting History Yet
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                        Join your first meeting to see it appear here
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<VideoCallIcon />}
                        onClick={() => routeTo("/home")}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 4,
                            py: 1.5
                        }}
                    >
                        Join a Meeting
                    </Button>
                </Paper>
            )}
        </Container>
    );
}