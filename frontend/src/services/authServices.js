import axios from "axios";

const API_URL = "/api/auth"; // Base URL for authentication routes

// Login function
export const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { username, password });
        return response.data; // Returns token and user data
    } catch (error) {
        throw error.response.data; // Handle errors
    }
};

// Register function
export const register = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data; // Returns success message
    } catch (error) {
        throw error.response.data; // Handle errors
    }
};