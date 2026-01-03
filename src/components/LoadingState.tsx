import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Colors } from '@/constants/Colors';
import ThemedText from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface LoadingStateProps {
    message?: string;
    transparent?: boolean;
}

export default function LoadingState({ message = 'Loading...', transparent = false }: LoadingStateProps) {
    const spinValue = useRef(new Animated.Value(0)).current;

    const background = useThemeColor({}, 'background');
    const primary = useThemeColor({}, 'primary');
    const surfaceSubtle = useThemeColor({}, 'surfaceSubtle');
    const textSecondary = useThemeColor({}, 'textSecondary');

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000, // slower, smoother
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (transparent) {
        return (
            <View style={styles.containerTransparent}>
                <ActivityIndicator size="large" color={primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <View style={styles.content}>
                {/* Custom Spinner Composition */}
                <View style={styles.spinnerContainer}>
                    {/* Static outer ring */}
                    <View style={[styles.ringBackground, { borderColor: surfaceSubtle }]} />
                    {/* Animated spinner */}
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Ionicons name="sync" size={48} color={primary} />
                    </Animated.View>
                </View>

                <ThemedText type="defaultSemiBold" style={[styles.text, { color: textSecondary }]}>{message}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    containerTransparent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    content: {
        alignItems: 'center',
        gap: 20,
    },
    spinnerContainer: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    ringBackground: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
    },
    text: {
        letterSpacing: 1,
    }
});
