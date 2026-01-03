import React, { createContext, useContext } from 'react';

// Force theme to always be 'light'
type Theme = 'light';

interface ThemeContextType {
    theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // No state needed, always light
    return (
        <ThemeContext.Provider value={{ theme: 'light' }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
