import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, StyleProp } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: StyleProp<ViewStyle>;
    icon?: keyof typeof Ionicons.glyphMap;
}

export default function Input({
    label,
    error,
    style,
    containerStyle,
    icon,
    ...props
}: InputProps) {
    const surfaceSubtle = useThemeColor({}, 'surfaceSubtle');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');
    const placeholderColor = useThemeColor({}, 'textSecondary');
    const errorColor = useThemeColor({}, 'error');
    const iconColor = useThemeColor({}, 'icon');

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <ThemedText type="defaultSemiBold" style={styles.label}>{label}</ThemedText>}
            <View style={styles.inputContainer}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={iconColor}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: surfaceSubtle,
                            borderColor: borderColor,
                            color: textColor
                        },
                        icon ? styles.inputWithIcon : null,
                        error ? { borderColor: errorColor, backgroundColor: 'rgba(239, 68, 68, 0.05)' } : null,
                        style
                    ]}
                    placeholderTextColor={placeholderColor}
                    autoCapitalize="none"
                    {...props}
                />
            </View>
            {error && <Text style={[styles.errorText, { color: errorColor }]}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 14,
    },
    inputContainer: {
        position: 'relative',
    },
    icon: {
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        minHeight: 52,
    },
    inputWithIcon: {
        paddingLeft: 48,
    },
    errorText: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    },
});
