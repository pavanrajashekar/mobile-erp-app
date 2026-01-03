import { View, StyleSheet, ViewStyle, ViewProps, StyleProp } from 'react-native';
import { Colors } from '../constants/Colors';

interface CardProps extends ViewProps {
    style?: StyleProp<ViewStyle>;
    variant?: 'elevated' | 'outlined' | 'flat';
    onPress?: () => void; // Optional if we want touchable cards later
}

export default function Card({ style, variant = 'elevated', children, ...props }: CardProps) {
    return (
        <View
            style={[
                styles.card,
                variant === 'elevated' && styles.elevated,
                variant === 'outlined' && styles.outlined,
                variant === 'flat' && styles.flat,
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 24, // Modern large radius
        padding: 24,
    },
    elevated: {
        ...Colors.shadow,
    },
    outlined: {
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: 'transparent',
    },
    flat: {
        backgroundColor: Colors.surfaceSubtle,
    },
});
