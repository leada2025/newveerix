import axios from 'axios';

const API = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // if you're using cookies for auth
});



export default API;
