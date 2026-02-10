"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type MaintenanceContextType = {
    maintenanceMode: boolean;
    toggleMaintenance: () => void;
    isAdmin: boolean;
};

const MaintenanceContext = createContext<MaintenanceContextType>({
    maintenanceMode: true,
    toggleMaintenance: () => { },
    isAdmin: false,
});

export function useMaintenanceMode() {
    return useContext(MaintenanceContext);
}

type MaintenanceProviderProps = {
    children: ReactNode;
    isAdmin: boolean;
};

export function MaintenanceProvider({ children, isAdmin }: MaintenanceProviderProps) {
    const [maintenanceMode, setMaintenanceMode] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    // 從 localStorage 讀取管理員的設定
    useEffect(() => {
        if (isAdmin) {
            const saved = localStorage.getItem("adminMaintenanceOff");
            if (saved === "true") {
                setMaintenanceMode(false);
            }
        }
        setIsLoaded(true);
    }, [isAdmin]);

    const toggleMaintenance = () => {
        const newValue = !maintenanceMode;
        setMaintenanceMode(newValue);
        // 儲存管理員的選擇（存的是「是否關閉維護」）
        localStorage.setItem("adminMaintenanceOff", String(!newValue));
    };

    // 非管理員永遠維持 maintenanceMode = true
    const effectiveMode = isAdmin ? maintenanceMode : true;

    // 避免 SSR hydration 不匹配（先回傳預設值）
    if (!isLoaded) {
        return (
            <MaintenanceContext.Provider value={{ maintenanceMode: true, toggleMaintenance, isAdmin }}>
                {children}
            </MaintenanceContext.Provider>
        );
    }

    return (
        <MaintenanceContext.Provider value={{ maintenanceMode: effectiveMode, toggleMaintenance, isAdmin }}>
            {children}
        </MaintenanceContext.Provider>
    );
}
