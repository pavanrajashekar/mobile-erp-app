import { View, StyleSheet, ViewStyle, ViewProps, StyleProp, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/context/ThemeContext';

interface CardProps extends ViewProps {
    style?: StyleProp<ViewStyle>;
    variant?: 'elevated' | 'outlined' | 'flat';
    onPress?: () => void;
    lightColor?: string;
    darkColor?: string;
}

export default function Card({ style, variant = 'elevated', children, onPress, lightColor, darkColor, ...props }: CardProps) {
    const surface = useThemeColor({ light: lightColor, dark: darkColor }, 'surface');
    const surfaceSubtle = useThemeColor({ light: lightColor, dark: darkColor }, 'surfaceSubtle');
    const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');
    const shadowColor = useThemeColor({ light: lightColor, dark: darkColor }, 'shadowColor');
    const { theme } = useTheme();

    const cardStyle = [
        styles.card,
        { backgroundColor: surface },
        variant === 'elevated' && {
            // Modern "Clean" shadow: softer, less spread, with a subtle border for definition
            shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme === 'light' ? 0.06 : 0.2, // Softer shadow in light
            shadowRadius: 8,
            elevation: 2,
            borderWidth: theme === 'light' ? 1 : 0, // Add subtle border in light mode for crisp definition
            borderColor: 'rgba(0,0,0,0.04)',
        },
        variant === 'outlined' && {
            borderWidth: 1,
            borderColor,
            backgroundColor: 'transparent',
        },
        variant === 'flat' && {
            backgroundColor: surfaceSubtle,
        },
        style
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7} {...(props as any)}>
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyle} {...props}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20, // Modern roundness
        padding: 20,
    },
});
