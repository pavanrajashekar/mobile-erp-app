import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';
import { Colors } from '../constants/Colors';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'outline' | 'ghost';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export default function Button({
    title,
    loading = false,
    variant = 'primary',
    style,
    textStyle,
    disabled,
    ...props
}: ButtonProps) {
    const isPrimary = variant === 'primary';
    const isOutline = variant === 'outline';

    const backgroundColor = isPrimary ? Colors.primary : 'transparent';
    const textColor = isPrimary ? Colors.white : Colors.primary;
    const borderColor = isOutline ? Colors.primary : 'transparent';

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor, borderColor, borderWidth: isOutline ? 1 : 0 },
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
                <Text style={[styles.text, { color: textColor }, textStyle]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
