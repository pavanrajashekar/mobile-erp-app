import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, TouchableOpacityProps, View } from 'react-native';
import { Colors } from '../constants/Colors';

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
    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';
    const isDanger = variant === 'danger';

    let backgroundColor = 'transparent';
    let textColor = Colors.primary;
    let borderColor = 'transparent';

    if (isPrimary) {
        backgroundColor = Colors.primary;
        textColor = Colors.white;
    } else if (isSecondary) {
        backgroundColor = Colors.primaryLight;
        textColor = Colors.primaryDark;
    } else if (isDanger) {
        backgroundColor = Colors.errorLight;
        textColor = Colors.error;
    } else if (isOutline) {
        borderColor = Colors.border;
        textColor = Colors.text;
    } else if (isGhost) {
        textColor = Colors.textSecondary;
    }

    const height = size === 'lg' ? 56 : size === 'md' ? 48 : 36;
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
            activeOpacity={0.7}
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
        borderRadius: 999, // Pill shape
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        fontWeight: '600',
    },
});
