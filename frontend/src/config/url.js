// src/config/url.js

const BASE_URL = 'http://localhost:9000';

export const API_URL = {
    // Base URL
    BASE: BASE_URL,

    // Authentication
    LOGIN: `${BASE_URL}/api/user/login`,
    REGISTER: `${BASE_URL}/api/user/register`,
    PROFILE: `${BASE_URL}/api/user/profile`,
    BECOME_CREATOR: `${BASE_URL}/api/user/become-creator`,

    // User related
    SEARCH_USERS: `${BASE_URL}/api/user/search`,
    FOLLOWING_DETAILS: `${BASE_URL}/api/user/following-details`,
    SUBSCRIBE: (userId) => `${BASE_URL}/api/user/subscribe/${userId}`,
    UNSUBSCRIBE: (userId) => `${BASE_URL}/api/user/unsubscribe/${userId}`,

    // Stream related
    START_STREAM: `${BASE_URL}/api/stream/start`,
    STOP_STREAM: (streamId) => `${BASE_URL}/api/stream/stop/${streamId}`,
    GET_LIVE_STREAMS: `${BASE_URL}/api/stream/live`,

   
};

export default API_URL;