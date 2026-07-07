"use client"
import { createContext, useContext, useState } from 'react';

const CallContext = createContext();

export function CallProvider({ children }) {
    const [isCallOngoing, setIsCallOngoing] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState(null);

    return (
        <CallContext.Provider value={{ 
            isCallOngoing, 
            setIsCallOngoing, 
            activeConversationId, 
            setActiveConversationId 
        }}>
            {children}
        </CallContext.Provider>
    );
}

export const useCall = () => useContext(CallContext);