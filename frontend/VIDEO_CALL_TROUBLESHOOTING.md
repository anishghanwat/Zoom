# Video Call Troubleshooting Guide

## Common Issues and Solutions

### 1. Video Call Not Working

**Symptoms:**
- Can't see other participants
- No video streams appearing
- Socket connection issues

**Solutions:**
1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for error messages in Console tab
   - Check Network tab for failed requests

2. **Verify Backend Connection:**
   - Ensure backend is running at: `https://zoom-642w.onrender.com`
   - Check if socket connection is established (green dot in debug panel)

3. **Check Meeting URL:**
   - Meeting URL should be in format: `/MEETING_CODE`
   - Example: `/ABC123` for meeting code "ABC123"

### 2. Video Flickering

**Symptoms:**
- Video constantly refreshing/reloading
- Poor video quality
- Video freezing

**Solutions:**
1. **Check Network Connection:**
   - Ensure stable internet connection
   - Try refreshing the page

2. **Browser Compatibility:**
   - Use Chrome, Firefox, or Edge (latest versions)
   - Ensure WebRTC is enabled

3. **Camera/Microphone Permissions:**
   - Allow camera and microphone access
   - Check if permissions are blocked

### 3. Debug Information

The app includes a debug panel showing:
- 🟢 Socket: Connected | 🔴 Socket: Disconnected
- Peers: Number of connected peers
- Videos: Number of video streams
- Stream: Local media stream status

### 4. Testing Steps

1. **Create a Meeting:**
   - Click "Create" button on home page
   - This generates a random meeting code
   - Navigate to the meeting room

2. **Join a Meeting:**
   - Enter meeting code in the input field
   - Click "Join Meeting" button
   - Enter your name in the lobby

3. **Check Console Logs:**
   - Look for connection messages
   - Verify peer connections are established
   - Check for any error messages

### 5. Backend Requirements

Ensure your backend supports:
- Socket.IO connections
- WebRTC signaling
- CORS for frontend domain
- HTTPS for production

### 6. Environment Variables

Set these in your `.env.local` file:
```
REACT_APP_API_BASE_URL=https://zoom-642w.onrender.com
```

## Getting Help

If issues persist:
1. Check browser console for errors
2. Verify backend is running and accessible
3. Test with different browsers
4. Check network connectivity
5. Ensure all permissions are granted
