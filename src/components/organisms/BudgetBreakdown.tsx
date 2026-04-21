import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/useTheme';
import { ProgressBar } from '@components/atoms/ProgressBar';
import type { BudgetWithSpend, ExpenseCategory } from '@/types';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: '🍜 Food & Dining',
  transport: '🚆 Transport',
  accommodation: '🏨 Accommodation',
  activities: '🎭 Activities',
  shopping: '🛍️ Shopping',
  other: '📦 Other',
};

const CATEGORY_ORDER: ExpenseCategory[] = [
  'accommodation',
  'food',
  'transport',
  'activities',
  'shopping',
  'other',
];

interface BudgetBreakdownProps {
  budget: BudgetWithSpend;
  showAllCategories?: boolean;
}

export function BudgetBreakdown({
  budget,
  showAllCategories = false,
}: BudgetBreakdownProps): React.ReactElement {
  const { theme } = useTheme();

  const spentPct = budget.totalAmount > 0
    ? Math.min((budget.totalSpent / budget.totalAmount) * 100, 100)
    : 0;

  const isOverBudget = budget.totalSpent > budget.totalAmount;

  const categoryColors: Record<ExpenseCategory, string> = {
    food: theme.category_food,
    transport: theme.category_transport,
    accommodation: theme.category_accommodation,
    activities: theme.category_culture,
    shopping: theme.brand_violet,
    other: theme.category_general,
  };

  const categories = CATEGORY_ORDER.filter(
    (cat) => showAllCategories || (budget.spentByCategory[cat] ?? 0) > 0
  );

  return (
    <View style={styles.container}>
      {/* Total summary */}
      <View style={[styles.totalCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
        <View style={styles.totalRow}>
          <View>
            <Text style={[styles.totalLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              Total Budget
            </Text>
            <Text style={[styles.totalAmount, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              {budget.currency} {budget.totalAmount.toLocaleString()}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.totalLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              {isOverBudget ? 'Over by' : 'Remaining'}
            </Text>
            <Text
              style={[
                styles.totalAmount,
                {
                  color: isOverBudget ? theme.system_error : theme.system_success,
                  fontFamily: theme.font_display,
                },
              ]}
            >
              {budget.currency} {Math.abs(budget.remaining).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.progressWrapper}>
          <ProgressBar
            value={spentPct}
            max={100}
            color={isOverBudget ? theme.system_error : theme.brand_lime}
            trackColor={theme.bg_raised}
            height={8}
            borderRadius={4}
          />
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              Spent: {budget.currency} {budget.totalSpent.toLocaleString()}
            </Text>
            <Text style={[styles.progressLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              {spentPct.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
            By Category
          </Text>
          {categories.map((cat) => {
            const spent = budget.spentByCategory[cat] ?? 0;
            const allocated =
              cat === 'food' ? budget.foodAllocation :
              cat === 'transport' ? budget.transportAllocation :
              cat === 'accommodation' ? budget.accommodationAllocation :
              cat === 'activities' ? budget.activitiesAllocation :
              budget.otherAllocation;
            const pct = allocated && allocated > 0
              ? Math.min((spent / allocated) * 100, 100)
              : budget.totalAmount > 0
              ? Math.min((spent / budget.totalAmount) * 100, 100)
              : 0;
            const color = categoryColors[cat];

            return (
              <View key={cat} style={styles.categoryRow}>
                <View style={styles.categoryHeader}>
                  <Text style={[styles.categoryLabel, { color: theme.text_primary, fontFamily: theme.font_body }]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                  <Text style={[styles.categoryAmount, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                    {budget.currency} {spent.toLocaleString()}
                    {allocated ? (
                      <Text style={{ color: theme.text_secondary }}>
                        {' '}/ {allocated.toLocaleString()}
                      </Text>
                    ) : null}
                  </Text>
                </View>
                <ProgressBar
                  value={pct}
                  max={100}
                  color={color}
                  trackColor={theme.bg_raised}
                  height={5}
                  borderRadius={3}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  totalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  totalLabel: { fontSize: 12, marginBottom: 2 },
  totalAmount: { fontSize: 22, fontWeight: '700' },
  progressWrapper: { gap: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12 },
  categoriesSection: { gap: 12 },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  categoryRow: { gap: 6 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: { fontSize: 14 },
  categoryAmount: { fontSize: 13 },
});
