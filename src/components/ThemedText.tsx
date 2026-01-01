import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { Colors } from '../constants/Colors';

interface ThemedTextProps extends TextProps {
    type?: 'title' | 'subtitle' | 'default' | 'defaultSemiBold' | 'caption' | 'link';
}

export default function ThemedText({ style, type = 'default', ...props }: ThemedTextProps) {
    return (
        <Text
            style={[
                styles.default,
                type === 'title' && styles.title,
                type === 'subtitle' && styles.subtitle,
                type === 'defaultSemiBold' && styles.defaultSemiBold,
                type === 'caption' && styles.caption,
                type === 'link' && styles.link,
                style,
            ]}
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.text,
    },
    defaultSemiBold: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600',
        color: Colors.text,
    },
    title: {
        fontSize: 28, // Slightly reduced from 32 for better mobile fit often
        fontWeight: 'bold',
        lineHeight: 32,
        color: Colors.text,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    caption: {
        fontSize: 12, // Small helper text
        color: Colors.textSecondary,
    },
    link: {
        fontSize: 16,
        lineHeight: 24,
        color: Colors.primary,
    },
});
