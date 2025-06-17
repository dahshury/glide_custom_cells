// @ts-nocheck
import React from "react";
import { Theme } from "@glideapps/glide-data-grid";
import { createGlideTheme } from "../utils/streamlitGlideTheme";

const darkTheme: Partial<Theme> = createGlideTheme("dark");
const lightTheme: Partial<Theme> = createGlideTheme("light");

export function useGridTheme() {
    const [theme, setTheme] = React.useState<Partial<Theme>>(darkTheme);

    // Apply theme class to document root for CSS variables
    React.useEffect(() => {
        const isDark = theme === darkTheme;
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Cleanup on unmount
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, [theme]);

    // Add CSS overrides for dropdown text color based on theme
    React.useEffect(() => {
        const styleId = 'dropdown-theme-override';
        let existingStyle = document.getElementById(styleId);
        
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = styleId;
        
        if (theme === lightTheme) {
            // Light theme: ensure dropdown text is black
            style.textContent = `
                .gdg-growing-entry .gdg-input,
                .gdg-growing-entry input,
                .gdg-growing-entry select,
                .gdg-growing-entry textarea,
                [class*="react-select"] .gdg-input,
                [class*="react-select"] input,
                [class*="react-select"] [class*="singleValue"],
                [class*="react-select"] [class*="placeholder"],
                [class*="react-select"] [class*="option"],
                [class*="react-select"] [class*="menu"] {
                color: #000000 !important;
                }
                
                [class*="react-select"] [class*="menu"] {
                background-color: #ffffff !important;
                }
                
                [class*="react-select"] [class*="option"]:hover {
                background-color: #f0f0f0 !important;
                color: #000000 !important;
                }
                
                [class*="react-select"] [class*="option--is-selected"] {
                background-color: #4F5DFF !important;
                color: #ffffff !important;
                }
            `;
        } else {
            // Dark theme: ensure dropdown text is light
            style.textContent = `
                .gdg-growing-entry .gdg-input,
                .gdg-growing-entry input,
                .gdg-growing-entry select,
                .gdg-growing-entry textarea,
                [class*="react-select"] .gdg-input,
                [class*="react-select"] input,
                [class*="react-select"] [class*="singleValue"],
                [class*="react-select"] [class*="placeholder"],
                [class*="react-select"] [class*="option"],
                [class*="react-select"] [class*="menu"] {
                color: #e8e8e8 !important;
                }
                
                [class*="react-select"] [class*="menu"] {
                background-color: #2a2a2a !important;
                }
                
                [class*="react-select"] [class*="option"]:hover {
                background-color: #404040 !important;
                color: #e8e8e8 !important;
                }
                
                [class*="react-select"] [class*="option--is-selected"] {
                background-color: #4F5DFF !important;
                color: #ffffff !important;
                }
            `;
        }
        
        document.head.appendChild(style);
        
        return () => {
            const styleToRemove = document.getElementById(styleId);
            if (styleToRemove) {
                styleToRemove.remove();
            }
        };
    }, [theme]); // Re-run when theme changes

    const iconColor = theme === darkTheme ? "#e8e8e8" : "#5f6368";

    return { theme, setTheme, darkTheme, lightTheme, iconColor };
} 