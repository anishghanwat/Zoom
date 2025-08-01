import { Children, createContext } from "react";
import axios from 'axios';


export const AuthContext = createContext({});

const client = axios.create({
    baseUrl: "localhost:8080/api/v1/users/"
})

export const AuthProvider = ({ Children }) => {

}