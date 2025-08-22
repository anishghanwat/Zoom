import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, Alert, Typography, Divider } from '@mui/material';

const defaultTheme = createTheme({
    palette: {
        primary: {
            main: '#2563eb',
        },
        secondary: {
            main: '#f59e0b',
        },
    },
    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        h4: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 600,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '12px 24px',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        '&:hover fieldset': {
                            borderColor: '#2563eb',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#2563eb',
                        },
                    },
                },
            },
        },
    },
});

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");

    const [authMode, setAuthMode] = React.useState(0); // 0 = login, 1 = register
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        setError(""); // clear old errors

        // Simple validation
        if (authMode === 1 && !name.trim()) return setError("Full Name is required.");
        if (!username.trim()) return setError("Username is required.");
        if (!password.trim()) return setError("Password is required.");

        try {
            if (authMode === 0) {
                await handleLogin(username, password);
            } else {
                const result = await handleRegister(name, username, password);
                setMessage(result);
                setOpen(true);
                setName("");
                setUsername("");
                setPassword("");
                setAuthMode(0);
            }
        } catch (err) {
            const errMsg = err?.response?.data?.message || "An error occurred. Please try again.";
            setError(errMsg);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAuth();
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />

                {/* Left Side Image */}
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    <Box sx={{ textAlign: 'center', zIndex: 2 }}>
                        <VideoCallIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
                        <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
                            Meetly
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 400 }}>
                            Connect with your loved ones through high-quality video conferencing
                        </Typography>
                    </Box>

                    {/* Overlay */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.3)',
                            zIndex: 1,
                        }}
                    />
                </Grid>

                {/* Right Side Form */}
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box sx={{
                        my: 8,
                        mx: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: 'calc(100vh - 64px)',
                        justifyContent: 'center'
                    }}>
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
                            <LockOutlinedIcon sx={{ fontSize: 28 }} />
                        </Avatar>

                        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2, textAlign: 'center' }}>
                            {authMode === 0 ? 'Welcome Back' : 'Create Account'}
                        </Typography>

                        <Typography variant="body1" color="textSecondary" sx={{ mb: 4, textAlign: 'center' }}>
                            {authMode === 0
                                ? 'Sign in to continue to your video calls'
                                : 'Join us and start connecting with others'
                            }
                        </Typography>

                        {/* Mode Switch Buttons */}
                        <Box sx={{ display: "flex", gap: 1, mb: 4, p: 1, bgcolor: 'grey.100', borderRadius: 3 }}>
                            <Button
                                variant={authMode === 0 ? "contained" : "text"}
                                onClick={() => setAuthMode(0)}
                                sx={{
                                    borderRadius: 2,
                                    px: 3,
                                    minWidth: 100,
                                    ...(authMode === 0 && {
                                        boxShadow: 'var(--shadow-md)',
                                    })
                                }}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant={authMode === 1 ? "contained" : "text"}
                                onClick={() => setAuthMode(1)}
                                sx={{
                                    borderRadius: 2,
                                    px: 3,
                                    minWidth: 100,
                                    ...(authMode === 1 && {
                                        boxShadow: 'var(--shadow-md)',
                                    })
                                }}
                            >
                                Sign Up
                            </Button>
                        </Box>

                        {/* Form */}
                        <Box component="form" noValidate sx={{ mt: 1, width: "100%" }}>
                            {authMode === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    autoComplete="name"
                                    autoFocus
                                />
                            )}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoComplete="username"
                                autoFocus={authMode === 0}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoComplete={authMode === 0 ? "current-password" : "new-password"}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{
                                    mt: 4,
                                    mb: 2,
                                    py: 1.5,
                                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: 'var(--shadow-lg)',
                                    }
                                }}
                                onClick={handleAuth}
                            >
                                {authMode === 0 ? "Sign In" : "Create Account"}
                            </Button>

                            <Divider sx={{ my: 3 }}>
                                <Typography variant="body2" color="textSecondary">
                                    or
                                </Typography>
                            </Divider>

                            <Button
                                fullWidth
                                variant="outlined"
                                sx={{
                                    py: 1.5,
                                    borderColor: 'grey.300',
                                    color: 'text.secondary',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        color: 'primary.main',
                                        background: 'rgba(37, 99, 235, 0.04)',
                                    }
                                }}
                                onClick={() => setAuthMode(authMode === 0 ? 1 : 0)}
                            >
                                {authMode === 0
                                    ? "Don't have an account? Sign Up"
                                    : "Already have an account? Sign In"
                                }
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Success Snackbar */}
            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setOpen(false)}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
}
