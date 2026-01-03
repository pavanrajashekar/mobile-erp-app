/**
 * Revenew Palette (Blue Theme)
 * Light: Clean White/Blue | Dark: Removed
 */

const palette = {
    // Brand Blues
    primaryDeep: '#004aad',   // Legacy - Kept for reference but unused
    primaryMid: '#166ad9',    // Secondary / Interactive
    primaryBright: '#2985ff', // Main Brand Color

    // Neutrals
    white: '#FFFFFF',

    // Functional
    red: '#EF4444',
    amber: '#F59E0B',
    green: '#10B981',
};

export const Colors = {
    light: {
        text: '#1E293B',             // Slate 800 - Deep Blue-Black (Softer than pure black)
        textSecondary: '#64748B',    // Slate 500 - Cool Gray
        textInverse: palette.white,

        background: '#F4F6F9',       // Bluish-Gray Background
        surface: '#FFFFFF',          // Clean White Surface (Card)
        surfaceSubtle: '#F1F5F9',    // Slate 100 - Inputs / Secondary backgrounds

        primary: palette.primaryBright,
        primaryLight: 'rgba(41, 133, 255, 0.12)', // Based on primaryBright

        border: '#E2E8F0',           // Slate 200 - Cool Border
        icon: '#64748B',             // Matches textSecondary

        success: palette.green,
        error: palette.red,
        warning: palette.amber,

        tabIconDefault: '#94A3B8',   // Slate 400
        tabIconSelected: palette.primaryBright,

        // Shadows
        shadowColor: '#64748B',      // Slate shadow
    },
};
