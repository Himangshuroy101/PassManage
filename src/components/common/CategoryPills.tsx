import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { VaultCategory } from '../../types/vault';
import { Colors } from '../../theme/colors';

interface CategoryPillsProps {
  activeCategory: VaultCategory;
  onSelectCategory: (cat: VaultCategory) => void;
}

const CATEGORIES: { id: VaultCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'all', label: 'All', icon: 'grid' },
  { id: 'favourite', label: 'Favourite', icon: 'heart' },
  { id: 'login', label: 'Login', icon: 'globe' },
  { id: 'mobile', label: 'Mobile App', icon: 'smartphone' },
  { id: 'payment', label: 'Payment', icon: 'credit-card' },
  { id: 'identity', label: 'Identity', icon: 'user' },
  { id: 'wifi', label: 'WiFi', icon: 'wifi' },
  { id: 'note', label: 'Secure Note', icon: 'file-text' },
];

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                isActive ? styles.pillActive : styles.pillInactive,
              ]}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Feather
                name={cat.icon}
                size={14}
                color={isActive ? '#FFFFFF' : Colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.pillText,
                  isActive ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: Colors.textSecondary,
  },
});
