"use client";
import { createContext, useContext, useState } from 'react';

const CallContext = createContext();

export function CallProvider({ children }) {
    const [isCallOngoing, setIsCallOngoing] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [callerName, setCallerName] = useState("");
    const [mediaType, setMediaType] = useState("audio");

    return (
        <CallContext.Provider value={{ 
            isCallOngoing, 
            setIsCallOngoing, 
            activeConversationId, 
            setActiveConversationId,
            callerName,
            setCallerName,
            mediaType,
            setMediaType
        }}>
            {children}
        </CallContext.Provider>
    );
}

export const useCall = () => useContext(CallContext);