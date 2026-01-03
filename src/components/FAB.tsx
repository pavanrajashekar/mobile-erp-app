import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface FABProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    variant?: 'primary' | 'secondary';
}

export const FAB = ({ onPress, icon = 'add', variant = 'primary' }: FABProps) => {
    return (
        <TouchableOpacity
            style={[
                styles.fab,
                { backgroundColor: variant === 'primary' ? Colors.primary : Colors.secondary }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons name={icon} size={28} color="white" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32, // More spacing from bottom
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        ...Colors.shadow,
        zIndex: 100,
    },
});
