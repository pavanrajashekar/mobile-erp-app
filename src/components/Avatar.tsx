import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '@/constants/Colors';
import ThemedText from './ThemedText';

interface AvatarProps {
    name?: string | null;
    size?: number;
    style?: StyleProp<ViewStyle>;
}

export default function Avatar({ name, size = 48, style }: AvatarProps) {
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
            { width: size, height: size, borderRadius: size / 2 },
            style
        ]}>
            <ThemedText type="defaultSemiBold" style={{ color: Colors.primary, fontSize }}>
                {getInitials(name)}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Colors.shadow,
        elevation: 5,
    },
});
