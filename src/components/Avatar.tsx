import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedText from './ThemedText';

interface AvatarProps {
    name?: string | null;
    size?: number;
    style?: StyleProp<ViewStyle>;
}

export default function Avatar({ name, size = 48, style }: AvatarProps) {
    const backgroundColor = useThemeColor({}, 'surface');
    const textColor = useThemeColor({}, 'primary');
    const shadowColor = useThemeColor({}, 'shadowColor');

    const getInitials = (n?: string | null) => {
        if (!n) return 'AD';
        const parts = n.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return n.slice(0, 2).toUpperCase();
    };

    const fontSize = size * 0.4;

    return (
        <View style={[
            styles.container,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor,
                shadowColor
            },
            style
        ]}>
            <ThemedText type="defaultSemiBold" style={{ color: textColor, fontSize }}>
                {getInitials(name)}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
});
