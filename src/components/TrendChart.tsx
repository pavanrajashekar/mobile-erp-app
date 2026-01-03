import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import ThemedText from './ThemedText';

interface TrendChartProps {
    data: number[];
    labels: string[];
}

export default function TrendChart({ data, labels }: TrendChartProps) {
    const maxValue = Math.max(...data, 1); // Avoid div by zero

    return (
        <View style={styles.container}>
            <View style={styles.chartArea}>
                {data.map((value, index) => {
                    const heightPercent = (value / maxValue) * 100;
                    return (
                        <View key={index} style={styles.barContainer}>
                            <View style={[styles.barTrack]}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: `${heightPercent}%`,
                                            backgroundColor: value > 0 ? Colors.primary : Colors.disabled
                                        }
                                    ]}
                                />
                            </View>
                            <ThemedText style={styles.label}>{labels[index]}</ThemedText>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 140,
        marginVertical: 16,
    },
    chartArea: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    barTrack: {
        width: 8,
        height: '80%',
        justifyContent: 'flex-end',
        backgroundColor: Colors.surfaceSubtle,
        borderRadius: 4,
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        borderRadius: 4,
        minHeight: 4, // Always show a tiny dot if it's 0 to preserve spacing
    },
    label: {
        fontSize: 10,
        color: Colors.textSecondary,
    }
});
