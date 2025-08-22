// Environment configuration for API endpoints
const IS_PROD = process.env.NODE_ENV === 'production';

// Use environment variable if available, otherwise fallback to hardcoded URLs
const server = process.env.REACT_APP_API_BASE_URL || (IS_PROD 
    ? "https://zoom-642w.onrender.com" 
    : "http://localhost:8000"
);

export default server;