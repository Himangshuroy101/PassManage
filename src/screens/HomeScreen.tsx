import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Header } from '../components/common/Header';
import { MetricGrid, MetricFilterType } from '../components/common/MetricCard';
import { CategoryPills } from '../components/common/CategoryPills';
import { VaultItemCard } from '../components/common/VaultItemCard';
import { useVault } from '../context/VaultContext';
import { Colors } from '../theme/colors';
import { VaultCategory } from '../types/vault';
import { isItemCompromised, isItemWeak, isItemReused } from '../services/security';

export const HomeScreen: React.FC = () => {
  const {
    items,
    stats,
    activeCategory,
    setActiveCategory,
    setSelectedItemForDetail,
    setActiveTab,
    setIsAddEditModalVisible,
    setItemToEdit,
    loadDemoData,
  } = useVault();

  const [metricFilter, setMetricFilter] = useState<MetricFilterType>('all');

  // Filter items by active metric and category
  const filteredItems = items.filter(item => {
    // 1. Metric filter
    if (metricFilter === 'compromised' && !isItemCompromised(item)) return false;
    if (metricFilter === 'weak' && !isItemWeak(item)) return false;
    if (metricFilter === 'reused' && !isItemReused(item, items)) return false;

    // 2. Category filter
    if (activeCategory === 'all') return true;
    if (activeCategory === 'favourite') return item.isFavorite;
    return item.category === activeCategory;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Emerald Curved Header with Health Score Gauge */}
        <Header showHealthGauge={true} />

        {/* 4 Interactive Security Metric Cards */}
        <MetricGrid
          total={stats.total}
          compromised={stats.compromised}
          weak={stats.weak}
          reused={stats.reused}
          activeFilter={metricFilter}
          onSelectFilter={setMetricFilter}
        />

        {/* Active Metric Filter Alert Banner (if filtering by security issue) */}
        {metricFilter !== 'all' && (
          <View style={styles.filterAlertBar}>
            <View style={styles.filterAlertInfo}>
              <Text style={styles.filterAlertTitle}>
                {metricFilter === 'compromised' && `🚨 ${filteredItems.length} Compromised Credentials`}
                {metricFilter === 'weak' && `⚠️ ${filteredItems.length} Weak Passwords`}
                {metricFilter === 'reused' && `🔄 ${filteredItems.length} Reused Passwords`}
              </Text>
              <Text style={styles.filterAlertDesc}>Filtered by security vulnerability</Text>
            </View>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => setMetricFilter('all')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearFilterText}>Reset</Text>
              <Feather name="x" size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        )}

        {/* Category Horizontal Filter Pills */}
        <CategoryPills
          activeCategory={activeCategory}
          onSelectCategory={(cat: VaultCategory) => setActiveCategory(cat)}
        />

        {/* Section Header: Top Vaults */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {metricFilter !== 'all'
              ? `${metricFilter.toUpperCase()} ITEMS`
              : activeCategory === 'all'
              ? 'Top Vault'
              : activeCategory === 'favourite'
              ? 'Favorite Vaults'
              : `${activeCategory.toUpperCase()} Vaults`}
          </Text>
          <TouchableOpacity
            onPress={() => setActiveTab('vault')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.seeAllText}>See all ({items.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Vault Items */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Feather name="shield" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {items.length === 0
                ? 'Your Vault is Empty & Encrypted'
                : 'No matching vault items'}
            </Text>
            <Text style={styles.emptySub}>
              {items.length === 0
                ? 'Store logins, mobile credentials, payment cards, or secure notes in client-side AES-256.'
                : metricFilter !== 'all'
                ? `No ${metricFilter} credentials found in this category.`
                : 'Tap the (+) button below to store your first password.'}
            </Text>

            {items.length === 0 ? (
              <View style={styles.emptyButtonsCol}>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => {
                    setItemToEdit(null);
                    setIsAddEditModalVisible(true);
                  }}
                >
                  <Feather name="plus-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>Add First Credential</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emptyDemoBtn}
                  onPress={async () => {
                    await loadDemoData();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  }}
                >
                  <Feather name="zap" size={15} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.emptyDemoBtnText}>Load Sample Data (6 Items)</Text>
                </TouchableOpacity>
              </View>
            ) : metricFilter !== 'all' ? (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setMetricFilter('all')}
              >
                <Text style={styles.emptyAddBtnText}>Show All Items</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => {
                  setItemToEdit(null);
                  setIsAddEditModalVisible(true);
                }}
              >
                <Text style={styles.emptyAddBtnText}>Add New Item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredItems.map(item => (
            <VaultItemCard
              key={item.id}
              item={item}
              onPress={() => setSelectedItemForDetail(item)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  filterAlertBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterAlertInfo: {
    flex: 1,
  },
  filterAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
  },
  filterAlertDesc: {
    fontSize: 11,
    color: '#C2410C',
    marginTop: 1,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  clearFilterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textDark,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  emptyButtonsCol: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  emptyAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyDemoBtn: {
    backgroundColor: '#E8FDF3',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDemoBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
