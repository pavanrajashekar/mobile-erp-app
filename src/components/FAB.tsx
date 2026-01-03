import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface FABProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    variant?: 'primary' | 'secondary';
}

export const FAB = ({ onPress, icon = 'add', variant = 'primary' }: FABProps) => {
    const primary = useThemeColor({}, 'primary');
    const surfaceSubtle = useThemeColor({}, 'surfaceSubtle');
    const iconColor = useThemeColor({}, 'icon');

    // FAB usually uses a strong background for primary action
    const backgroundColor = variant === 'primary' ? primary : surfaceSubtle;
    const contentColor = variant === 'primary' ? '#FFFFFF' : iconColor;
    const shadowColor = useThemeColor({}, 'shadowColor');

    return (
        <TouchableOpacity
            style={[
                styles.fab,
                {
                    backgroundColor,
                    shadowColor,
                }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Ionicons name={icon} size={28} color={contentColor} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 32,
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
    },
});
