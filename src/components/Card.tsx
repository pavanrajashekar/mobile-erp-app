import { View, StyleSheet, ViewStyle, ViewProps, StyleProp } from 'react-native';
import { Colors } from '../constants/Colors';

interface CardProps extends ViewProps {
    style?: StyleProp<ViewStyle>;
    variant?: 'elevated' | 'outlined' | 'flat';
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
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
    },
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    outlined: {
        borderWidth: 1,
        borderColor: Colors.border,
    },
    flat: {
        backgroundColor: Colors.inputBackground,
    },
});
