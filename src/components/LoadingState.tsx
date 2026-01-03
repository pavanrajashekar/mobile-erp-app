import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Colors } from '@/constants/Colors';
import ThemedText from './ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface LoadingStateProps {
    message?: string;
    transparent?: boolean;
}

export default function LoadingState({ message = 'Loading...', transparent = false }: LoadingStateProps) {
    const spinValue = useRef(new Animated.Value(0)).current;

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
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Custom Spinner Composition */}
                <View style={styles.spinnerContainer}>
                    {/* Static outer ring */}
                    <View style={styles.ringBackground} />
                    {/* Animated spinner */}
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Ionicons name="sync" size={48} color={Colors.primary} />
                    </Animated.View>
                </View>

                <ThemedText type="defaultSemiBold" style={styles.text}>{message}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
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
        borderColor: Colors.surfaceSubtle,
    },
    text: {
        color: Colors.textSecondary,
        letterSpacing: 1,
    }
});
