import React, { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import {
    Badge,
    IconButton,
    TextField,
    Button,
    Typography,
    Box,
    Slide
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import styles from "../styles/VideoMeet.module.css";
import server from "../environment";

const SERVER_URL = server;
const RTC_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function VideoMeetComponent() {
    const socketRef = useRef(null);
    const peersRef = useRef({}); // { socketId: RTCPeerConnection }
    const localVideoRef = useRef(null);

    const [username, setUsername] = useState("");
    const [askForUsername, setAskForUsername] = useState(true);

    const [localStream, setLocalStream] = useState(null);
    const [videos, setVideos] = useState([]); // [{ socketId, stream }]

    const [videoOn, setVideoOn] = useState(true);
    const [audioOn, setAudioOn] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [screenStreamRef] = useState({ current: null });

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatOpen, setChatOpen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");

    // --- Cleanup helper (stable reference) ---
    const cleanupAll = useCallback(() => {
        // close peers
        Object.values(peersRef.current).forEach((pc) => {
            try {
                pc.close();
            } catch (e) { }
        });

        peersRef.current = {};

        // stop local stream
        if (localStream) {
            try {
                localStream.getTracks().forEach((t) => t.stop());
            } catch (e) { }
        }

        // disconnect socket
        try {
            if (socketRef.current) socketRef.current.disconnect();
        } catch (e) { }
    }, [localStream]);

    // --- Mount / Unmount ---
    useEffect(() => {
        // run once
        getPermissions();

        return () => {
            // cleanup on unmount
            cleanupAll();
        };
    }, [cleanupAll]);

    // ensure local video element gets assigned stream when stream changes or when the ref remounts
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // ----------------- Permissions & initial user media -----------------
    async function getPermissions() {
        try {
            const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            if (!hasGetUserMedia) {
                console.warn("getUserMedia not supported");
                return;
            }

            // request both, but if denied we'll toggle accordingly
            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });
                setLocalStream(s);
                setVideoOn(true);
                setAudioOn(true);
            } catch (err) {
                console.warn("Video+Audio permission denied, trying audio only:", err);
                // try audio only
                try {
                    const a = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true
                        }
                    });
                    setLocalStream(a);
                    setVideoOn(false);
                    setAudioOn(true);
                } catch (err2) {
                    console.warn("Audio permission also denied:", err2);
                    // no media available
                    setLocalStream(null);
                    setVideoOn(false);
                    setAudioOn(false);
                }
            }
        } catch (error) {
            console.error("getPermissions error", error);
        }
    }

    // ----------------- Socket / WebRTC helpers -----------------
    function connectSocket() {
        if (socketRef.current) return;

        try {
            console.log("Connecting to socket server:", SERVER_URL);
            socketRef.current = io(SERVER_URL, {
                secure: window.location.protocol === "https:",
                transports: ['polling', 'websocket'], // Try polling first, then websocket
                timeout: 30000,
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000,
                forceNew: true,
                upgrade: true
            });

            socketRef.current.on("connect", () => {
                console.log("Socket connected successfully, ID:", socketRef.current.id);
                setConnectionStatus("connected");
                // Get the meeting URL from the current path
                const meetingUrl = window.location.pathname;
                socketRef.current.emit("join-call", meetingUrl);
                console.log("Emitted join-call with URL:", meetingUrl);
            });

            socketRef.current.on("connect_error", (error) => {
                console.error("Socket connection error:", error);
                console.log("Error details:", {
                    message: error.message,
                    description: error.description,
                    context: error.context
                });

                // Try to reconnect with different transport
                if (socketRef.current) {
                    console.log("Attempting to reconnect with polling transport...");
                    socketRef.current.io.opts.transports = ['polling'];
                    socketRef.current.connect();
                }
            });

            socketRef.current.on("error", (error) => {
                console.error("Socket error:", error);
            });

            socketRef.current.on("reconnect_attempt", (attemptNumber) => {
                console.log("Reconnection attempt:", attemptNumber);
            });

            socketRef.current.on("reconnect_failed", () => {
                console.error("Failed to reconnect after all attempts");
            });

            socketRef.current.on("user-joined", (newId, clients) => {
                console.log("User joined event:", { newId, clients });
                handleUserJoined(newId, clients);
            });

            socketRef.current.on("signal", (fromId, message) => {
                console.log("Received signal from:", fromId);
                handleSignal(fromId, message);
            });

            socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
                // Ignore our own echoed messages to prevent duplicates
                if (socketIdSender === socketRef.current.id) return;
                setMessages((prev) => [...prev, { sender, data, timestamp: new Date() }]);
                setUnreadCount((c) => (chatOpen ? c : c + 1));
            });

            socketRef.current.on("user-left", (id) => {
                console.log("User left:", id);
                // remove peer and video
                if (peersRef.current[id]) {
                    try {
                        peersRef.current[id].close();
                    } catch (e) { }
                    delete peersRef.current[id];
                }
                setVideos((v) => v.filter((x) => x.socketId !== id));
            });

            socketRef.current.on("disconnect", (reason) => {
                console.log("Socket disconnected:", reason);
                setConnectionStatus("disconnected");
                if (reason === "io server disconnect") {
                    // the disconnection was initiated by the server, reconnect manually
                    socketRef.current.connect();
                }
            });

        } catch (error) {
            console.error("Failed to create socket connection:", error);
        }
    }

    async function handleUserJoined(newId, clients) {
        // create peers for each client (if not existing)
        clients.forEach((clientId) => {
            if (clientId === socketRef.current.id) return;
            if (peersRef.current[clientId]) return;

            createPeer(clientId, true);
        });

        // if I am the one who joined (server told me), create offers to others
        if (newId === socketRef.current.id) {
            Object.keys(peersRef.current).forEach(async (id) => {
                try {
                    const pc = peersRef.current[id];
                    // add current tracks
                    if (localStream) {
                        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
                    }

                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketRef.current.emit("signal", id, JSON.stringify({ sdp: pc.localDescription }));
                } catch (e) {
                    console.error(e);
                }
            });
        }
    }

    function createPeer(socketId, isInitiator = false) {
        const pc = new RTCPeerConnection(RTC_CONFIG);

        // store it
        peersRef.current[socketId] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate to:", socketId);
                socketRef.current.emit("signal", socketId, JSON.stringify({ ice: event.candidate }));
            }
        };

        // when remote track(s) arrive
        pc.ontrack = (event) => {
            console.log("Received track from peer:", socketId, event.track.kind);
            // event.streams may contain the stream (modern browsers)
            const stream = event.streams && event.streams[0] ? event.streams[0] : null;
            if (!stream) {
                console.warn("No stream in track event for:", socketId);
                return;
            }

            setVideos((prev) => {
                const exists = prev.find((v) => v.socketId === socketId);
                if (exists) {
                    return prev.map((v) => (v.socketId === socketId ? { ...v, stream } : v));
                }
                return [...prev, { socketId, stream }];
            });
        };

        // clean up when connection closes
        pc.onconnectionstatechange = () => {
            console.log("Peer connection state changed:", socketId, pc.connectionState);
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
                delete peersRef.current[socketId];
                setVideos((v) => v.filter((x) => x.socketId !== socketId));
            }
        };

        // Add connection state logging
        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", socketId, pc.iceConnectionState);
        };

        return pc;
    }

    async function handleSignal(fromId, message) {
        console.log("Processing signal from:", fromId, "Type:", message ? JSON.parse(message).sdp?.type || 'ICE' : 'Unknown');

        if (!peersRef.current[fromId]) {
            console.log("Creating new peer for:", fromId);
            // create a peer if it doesn't exist
            createPeer(fromId, false);
        }

        const pc = peersRef.current[fromId];
        const signal = JSON.parse(message);

        try {
            if (signal.sdp) {
                console.log("Setting remote description:", signal.sdp.type);
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

                if (signal.sdp.type === "offer") {
                    console.log("Creating answer for offer from:", fromId);
                    // add local tracks then answer
                    if (localStream) {
                        localStream.getTracks().forEach((t) => {
                            console.log("Adding track to peer:", t.kind);
                            pc.addTrack(t, localStream);
                        });
                    }

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log("Sending answer to:", fromId);
                    socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: pc.localDescription }));
                }
            }

            if (signal.ice) {
                console.log("Adding ICE candidate from:", fromId);
                await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
            }
        } catch (e) {
            console.error("handleSignal error:", e);
        }
    }

    // ----------------- Actions -----------------
    async function startCall() {
        console.log("Starting call with username:", username);
        setAskForUsername(false);

        // Connect to socket first
        connectSocket();

        // Wait a bit for socket to connect
        setTimeout(() => {
            // ensure local preview attaches in meeting view as well
            if (localVideoRef.current && localStream) {
                localVideoRef.current.srcObject = localStream;
                console.log("Local video attached to meeting view");
            }

            // add local tracks to all existing peers
            Object.keys(peersRef.current).forEach((id) => {
                try {
                    if (localStream) {
                        localStream.getTracks().forEach((t) => {
                            console.log("Adding track to existing peer:", id, t.kind);
                            peersRef.current[id].addTrack(t, localStream);
                        });
                    }
                } catch (e) {
                    console.error("Error adding tracks to peer:", id, e);
                }
            });
        }, 1000);
    }



    function endCall() {
        cleanupAll();
        window.location.href = "/"; // or whatever behaviour you want
    }

    function toggleVideo() {
        if (!localStream) return;
        const newVal = !videoOn;
        setVideoOn(newVal);
        localStream.getVideoTracks().forEach((t) => (t.enabled = newVal));
    }

    function toggleAudio() {
        if (!localStream) return;
        const newVal = !audioOn;
        setAudioOn(newVal);
        localStream.getAudioTracks().forEach((t) => (t.enabled = newVal));
    }

    // screen share: replace sender track with screen track (if possible)
    async function toggleScreenShare() {
        if (screenSharing) {
            // stop screen share and restore camera track(s)
            try {
                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach((t) => t.stop());
                    screenStreamRef.current = null;
                }

                // for each peer, replace the sender with the original local video track
                Object.values(peersRef.current).forEach((pc) => {
                    const senders = pc.getSenders();
                    const videoSender = senders.find((s) => s.track && s.track.kind === "video");
                    if (videoSender) {
                        const camTrack = localStream && localStream.getVideoTracks()[0];
                        if (camTrack) videoSender.replaceTrack(camTrack).catch((e) => console.warn(e));
                    }
                });

                setScreenSharing(false);
            } catch (e) {
                console.warn(e);
            }
            return;
        }

        // start screen share
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return;

        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStreamRef.current = screenStream;

            // replace track for each peer
            Object.values(peersRef.current).forEach((pc) => {
                const senders = pc.getSenders();
                const videoSender = senders.find((s) => s.track && s.track.kind === "video");
                if (videoSender) {
                    const screenTrack = screenStream.getVideoTracks()[0];
                    videoSender.replaceTrack(screenTrack).catch((e) => console.warn(e));
                } else {
                    // if no sender exists, add track
                    screenStream.getTracks().forEach((t) => pc.addTrack(t, screenStream));
                }
            });

            // also show screen locally
            setLocalStream((prev) => {
                // create a merged stream: use screen video + previous audio
                const mixed = new MediaStream();
                const screenVideo = screenStream.getVideoTracks()[0];
                if (screenVideo) mixed.addTrack(screenVideo);
                if (prev) prev.getAudioTracks().forEach((t) => mixed.addTrack(t));
                return mixed;
            });

            // when screen sharing stops
            screenStream.getTracks()[0].onended = () => {
                // restore local stream (camera + mic)
                getPermissions().then(() => {
                    // after permissions restored, replace tracks back
                    Object.values(peersRef.current).forEach((pc) => {
                        const senders = pc.getSenders();
                        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
                        const camTrack = localStream && localStream.getVideoTracks()[0];
                        if (videoSender && camTrack) videoSender.replaceTrack(camTrack).catch((e) => console.warn(e));
                    });
                });

                setScreenSharing(false);
            };

            setScreenSharing(true);
        } catch (e) {
            console.warn("screen share failed", e);
        }
    }

    function sendMessage() {
        if (!socketRef.current || !message.trim()) return;
        socketRef.current.emit("chat-message", message, username);
        setMessages((m) => [...m, { sender: username, data: message, timestamp: new Date() }]);
        setMessage("");
    }

    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // ----------------- UI -----------------
    return (
        <div className={styles.meetVideoContainer}>
            {askForUsername ? (
                <div className={styles.lobbyContainer}>
                    <Typography variant="h2" className={styles.lobbyTitle}>
                        Enter Meeting Lobby
                    </Typography>

                    <div className={styles.lobbyForm}>
                        <TextField
                            fullWidth
                            label="Your Name"
                            variant="outlined"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your name to join"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: 'var(--primary-color)',
                                    },
                                }
                            }}
                        />

                        {/* Connection Status */}
                        <div style={{
                            margin: '16px 0',
                            padding: '12px',
                            borderRadius: '8px',
                            background: connectionStatus === 'connected' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            border: `1px solid ${connectionStatus === 'connected' ? '#4caf50' : '#f44336'}`,
                            color: connectionStatus === 'connected' ? '#4caf50' : '#f44336',
                            textAlign: 'center',
                            fontSize: '14px'
                        }}>
                            {connectionStatus === 'connected' ? '🟢 Connected to server' : '🔴 Connecting to server...'}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                            <Button
                                variant="contained"
                                onClick={startCall}
                                disabled={!username.trim()}
                                startIcon={<VideocamIcon />}
                                sx={{
                                    width: '100%',
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
                                Join Meeting
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={() => {
                                    console.log("Testing connection manually...");
                                    connectSocket();
                                }}
                                startIcon={<VideocamIcon />}
                                sx={{
                                    width: '100%',
                                    height: 40,
                                    borderRadius: 2,
                                    borderColor: 'var(--primary-color)',
                                    color: 'var(--primary-color)',
                                    '&:hover': {
                                        borderColor: 'var(--primary-dark)',
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    }
                                }}
                            >
                                Test Connection
                            </Button>
                        </div>
                    </div>

                    {localStream && (
                        <div className={styles.lobbyPreview}>
                            <video ref={localVideoRef} autoPlay muted playsInline />
                        </div>
                    )}
                </div>
            ) : (
                <div className={`${styles.meetingInterface} ${chatOpen ? styles.chatOpen : ''}`}>
                    {/* Video Grid */}
                    <div className={styles.videoGrid}>
                        {videos.map((v) => (
                            <div key={v.socketId} className={styles.videoItem}>
                                <video
                                    autoPlay
                                    playsInline
                                    muted={false}
                                    ref={(el) => {
                                        if (el && el.srcObject !== v.stream) {
                                            el.srcObject = v.stream;
                                        }
                                    }}
                                    onLoadedMetadata={() => {
                                        console.log("Remote video loaded for:", v.socketId);
                                    }}
                                />
                                <div className={styles.videoLabel}>
                                    {v.socketId.slice(0, 8)}...
                                </div>
                            </div>
                        ))}

                        {videos.length === 0 && (
                            <div className={styles.emptyState}>
                                <VideocamIcon />
                                <Typography variant="h6">Waiting for others to join...</Typography>
                                <Typography variant="body2">
                                    Share this meeting link with others to start the call
                                </Typography>
                            </div>
                        )}
                    </div>

                    {/* Local Video */}
                    {localStream && (
                        <div className={styles.localVideo}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                onLoadedMetadata={() => {
                                    console.log("Local video loaded successfully");
                                }}
                            />
                            <div className={styles.statusIndicator}></div>
                        </div>
                    )}

                    {/* Control Bar */}
                    <div className={styles.controlBar}>
                        <IconButton
                            className={`${styles.controlButton} ${videoOn ? 'active' : ''}`}
                            onClick={toggleVideo}
                        >
                            {videoOn ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton
                            className={`${styles.controlButton} ${audioOn ? 'active' : ''}`}
                            onClick={toggleAudio}
                        >
                            {audioOn ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        <IconButton
                            className={`${styles.controlButton} ${screenSharing ? 'active' : ''}`}
                            onClick={toggleScreenShare}
                        >
                            {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                        </IconButton>

                        <IconButton
                            className={`${styles.controlButton} danger`}
                            onClick={endCall}
                        >
                            <CallEndIcon />
                        </IconButton>

                        <Badge badgeContent={unreadCount} color="error">
                            <IconButton
                                className={styles.controlButton}
                                onClick={() => { setChatOpen(!chatOpen); setUnreadCount(0); }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                        {/* Debug Info */}
                        <div style={{
                            position: 'absolute',
                            top: '-60px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                        }}>
                            Socket: {socketRef.current?.connected ? '🟢' : '🔴'} |
                            Peers: {Object.keys(peersRef.current).length} |
                            Videos: {videos.length} |
                            Stream: {localStream ? '🟢' : '🔴'}
                        </div>
                    </div>

                    {/* Chat Interface */}
                    <Slide direction="left" in={chatOpen} mountOnEnter unmountOnExit>
                        <div className={styles.chatInterface}>
                            <div className={styles.chatHeader}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">Chat</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setChatOpen(false)}
                                        sx={{ color: 'white' }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                            </div>

                            <div className={styles.chatMessages}>
                                {messages.length > 0 ? (
                                    messages.map((item, i) => (
                                        <div key={i} className={`${styles.message} ${item.sender === username ? styles.sent : styles.received}`}>
                                            {item.sender !== username && (
                                                <div className={styles.messageSender}>{item.sender}</div>
                                            )}
                                            <div className={styles.messageBubble}>
                                                {item.data}
                                            </div>
                                            <div className={styles.messageTime}>
                                                {formatTime(item.timestamp)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>
                                        <ChatIcon />
                                        <Typography variant="h6">No messages yet</Typography>
                                        <Typography variant="body2">
                                            Start the conversation by sending a message
                                        </Typography>
                                    </div>
                                )}
                            </div>

                            <div className={styles.chatInput}>
                                <div className={styles.chatInputForm}>
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    />
                                    <button onClick={sendMessage}>
                                        <SendIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Slide>
                </div>
            )}
        </div>
    );
}
