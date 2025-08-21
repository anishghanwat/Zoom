import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
    Badge,
    IconButton,
    TextField,
    Button,
    Paper,
    Typography,
    Box,
    Fade,
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

    const [connected, setConnected] = useState(false);
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

    // --- Mount / Unmount ---
    useEffect(() => {
        // run once
        getPermissions();

        return () => {
            // cleanup on unmount
            cleanupAll();
        };
    }, []);

    // ensure local video element gets assigned stream when stream changes
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // ----------------- Permissions & initial user media -----------------
    async function getPermissions() {
        try {
            const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            if (!hasGetUserMedia) return;

            // request both, but if denied we'll toggle accordingly
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(s);
                setVideoOn(true);
                setAudioOn(true);
            } catch (err) {
                // try audio only
                try {
                    const a = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setLocalStream(a);
                    setVideoOn(false);
                    setAudioOn(true);
                } catch (err2) {
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

        socketRef.current = io(SERVER_URL, { secure: window.location.protocol === "https:" });

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href);
            console.log("socket connected", socketRef.current.id);
        });

        socketRef.current.on("user-joined", handleUserJoined);

        socketRef.current.on("signal", handleSignal);

        socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
            setMessages((prev) => [...prev, { sender, data, timestamp: new Date() }]);
            if (socketRef.current && socketRef.current.id !== socketIdSender) {
                setUnreadCount((c) => c + 1);
            }
        });

        socketRef.current.on("user-left", (id) => {
            // remove peer and video
            if (peersRef.current[id]) {
                try {
                    peersRef.current[id].close();
                } catch (e) { }
                delete peersRef.current[id];
            }
            setVideos((v) => v.filter((x) => x.socketId !== id));
        });
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
                socketRef.current.emit("signal", socketId, JSON.stringify({ ice: event.candidate }));
            }
        };

        // when remote track(s) arrive
        pc.ontrack = (event) => {
            // event.streams may contain the stream (modern browsers)
            const stream = event.streams && event.streams[0] ? event.streams[0] : null;
            if (!stream) return;

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
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
                delete peersRef.current[socketId];
                setVideos((v) => v.filter((x) => x.socketId !== socketId));
            }
        };

        return pc;
    }

    async function handleSignal(fromId, message) {
        if (!peersRef.current[fromId]) {
            // create a peer if it doesn't exist
            createPeer(fromId, false);
        }

        const pc = peersRef.current[fromId];
        const signal = JSON.parse(message);

        try {
            if (signal.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                if (signal.sdp.type === "offer") {
                    // add local tracks then answer
                    if (localStream) localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: pc.localDescription }));
                }
            }

            if (signal.ice) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
            }
        } catch (e) {
            console.error("handleSignal error", e);
        }
    }

    // ----------------- Actions -----------------
    async function startCall() {
        setAskForUsername(false);
        setConnected(true);
        connectSocket();

        // add local tracks to all existing peers
        Object.keys(peersRef.current).forEach((id) => {
            try {
                if (localStream) localStream.getTracks().forEach((t) => peersRef.current[id].addTrack(t, localStream));
            } catch (e) { }
        });
    }

    function cleanupAll() {
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
                        const camTrack = window.localStream && window.localStream.getVideoTracks()[0];
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
                        
                        <Button
                            variant="contained"
                            onClick={startCall}
                            disabled={!username.trim()}
                            startIcon={<VideocamIcon />}
                            sx={{
                                minWidth: 200,
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
                    </div>

                    {localStream && (
                        <div className={styles.lobbyPreview}>
                            <video ref={localVideoRef} autoPlay muted playsInline />
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.meetingInterface}>
                    {/* Video Grid */}
                    <div className={styles.videoGrid}>
                        {videos.map((v) => (
                            <div key={v.socketId} className={styles.videoItem}>
                                <video
                                    autoPlay
                                    playsInline
                                    ref={(el) => {
                                        if (el) el.srcObject = v.stream;
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
                            <video ref={localVideoRef} autoPlay muted playsInline />
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
                                        <div key={i} className={`${styles.message} ${item.sender === username ? 'sent' : 'received'}`}>
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
