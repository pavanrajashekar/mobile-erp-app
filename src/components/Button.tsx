import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, TouchableOpacityProps, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'outline' | 'ghost' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export default function Button({
    title,
    loading = false,
    variant = 'primary',
    size = 'md',
    style,
    textStyle,
    disabled,
    icon,
    ...props
}: ButtonProps) {
    const primary = useThemeColor({}, 'primary');
    const primaryLight = useThemeColor({}, 'primaryLight');
    const border = useThemeColor({}, 'border');
    const text = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const errorColor = useThemeColor({}, 'error');
    // Button text on primary should be white.
    // In dark mode, primary is bright blue, white text works.
    const onPrimaryText = '#FFFFFF';

    let backgroundColor = 'transparent';
    let textColor = primary;
    let borderColor = 'transparent';

    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';
    const isDanger = variant === 'danger';

    if (isPrimary) {
        backgroundColor = primary;
        textColor = onPrimaryText;
    } else if (isSecondary) {
        backgroundColor = primaryLight;
        textColor = primary;
    } else if (isDanger) {
        backgroundColor = 'rgba(239, 68, 68, 0.1)';
        textColor = errorColor;
    } else if (isOutline) {
        borderColor = border;
        textColor = text;
    } else if (isGhost) {
        textColor = textSecondary;
    }

    const height = size === 'lg' ? 56 : size === 'md' ? 50 : 36; // Slightly taller md
    const paddingHorizontal = size === 'lg' ? 32 : size === 'md' ? 24 : 16;
    const fontSize = size === 'lg' ? 18 : size === 'md' ? 16 : 14;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor,
                    borderColor,
                    borderWidth: isOutline ? 1 : 0,
                    height,
                    paddingHorizontal
                },
                (disabled || loading) && styles.disabled,
                style
            ]}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <>
                    {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                    <Text style={[styles.text, { color: textColor, fontSize }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        // Let's go with 16 for a consistent "Soft" look matching cards (20)
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontWeight: '600', // SemiBold
        letterSpacing: 0.3,
    },
});
