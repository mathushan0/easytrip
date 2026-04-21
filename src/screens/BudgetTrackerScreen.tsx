import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/useTheme';
import { BudgetBreakdown } from '@components/organisms/BudgetBreakdown';
import { Button } from '@components/atoms/Button';
import { Badge } from '@components/atoms/Badge';
import type { BudgetWithSpend, Expense, ExpenseCategory } from '@/types';

const MOCK_BUDGET: BudgetWithSpend = {
  id: 'b1',
  tripId: 't1',
  totalAmount: 2500,
  currency: 'GBP',
  foodAllocation: 600,
  transportAllocation: 300,
  accommodationAllocation: 900,
  activitiesAllocation: 400,
  otherAllocation: 300,
  createdAt: '',
  updatedAt: '',
  totalSpent: 1240,
  remaining: 1260,
  spentByCategory: {
    food: 280,
    transport: 120,
    accommodation: 450,
    activities: 280,
    shopping: 110,
    other: 0,
  },
};

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1', tripId: 't1', userId: 'u1', amount: 450, currency: 'GBP',
    amountInBase: 450, exchangeRate: 1, category: 'accommodation',
    description: 'The Millennials Shinjuku — 3 nights', venueId: null, taskId: null,
    loggedAt: '2026-04-20T15:00:00Z', createdAt: '',
  },
  {
    id: 'e2', tripId: 't1', userId: 'u1', amount: 1200, currency: 'JPY',
    amountInBase: 6.8, exchangeRate: 176.47, category: 'food',
    description: 'Ichiran Ramen', venueId: null, taskId: null,
    loggedAt: '2026-04-20T20:00:00Z', createdAt: '',
  },
  {
    id: 'e3', tripId: 't1', userId: 'u1', amount: 500, currency: 'JPY',
    amountInBase: 2.83, exchangeRate: 176.47, category: 'activities',
    description: 'Shinjuku Gyoen entrance', venueId: null, taskId: null,
    loggedAt: '2026-04-20T16:30:00Z', createdAt: '',
  },
];

const CAT_LABELS: Record<ExpenseCategory, string> = {
  food: '🍜 Food',
  transport: '🚆 Transport',
  accommodation: '🏨 Accommodation',
  activities: '🎭 Activities',
  shopping: '🛍 Shopping',
  other: '📦 Other',
};

const EXCHANGE_RATES: Record<string, number> = {
  JPY: 176.47,
  USD: 1.26,
  EUR: 1.16,
  GBP: 1,
};

export function BudgetTrackerScreen(): React.ReactElement {
  const { theme, resolvedCategoryColour } = useTheme();
  const [showLogModal, setShowLogModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState('GBP');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('food');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);

  const logExpense = () => {
    if (!expenseAmount) return;
    const rate = EXCHANGE_RATES[expenseCurrency] ?? 1;
    const amountInBase = parseFloat(expenseAmount) / rate;
    const newExpense: Expense = {
      id: `e-${Date.now()}`,
      tripId: 't1',
      userId: 'u1',
      amount: parseFloat(expenseAmount),
      currency: expenseCurrency,
      amountInBase,
      exchangeRate: rate,
      category: expenseCategory,
      description: expenseDescription || null,
      venueId: null,
      taskId: null,
      loggedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setExpenseAmount('');
    setExpenseDescription('');
    setShowLogModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg_primary }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: theme.space_md }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              Budget Tracker
            </Text>
            <Text style={[styles.headerSub, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
              Tokyo · GBP
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
            >
              <Text style={{ fontSize: 14, color: theme.text_secondary }}>📤 CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.space_md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Budget breakdown */}
          <BudgetBreakdown budget={MOCK_BUDGET} showAllCategories />

          {/* Currency converter */}
          <View style={[styles.converterCard, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}>
            <Text style={[styles.cardTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
              Quick Converter
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratesRow}>
              {Object.entries(EXCHANGE_RATES)
                .filter(([code]) => code !== 'GBP')
                .map(([code, rate]) => (
                  <View key={code} style={[styles.rateChip, { backgroundColor: theme.bg_raised }]}>
                    <Text style={[styles.rateCode, { color: theme.text_secondary, fontFamily: theme.font_mono }]}>
                      {code}
                    </Text>
                    <Text style={[styles.rateValue, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                      {rate.toFixed(0)}
                    </Text>
                    <Text style={[styles.rateLabel, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                      per £1
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </View>

          {/* Recent expenses */}
          <View style={styles.expensesSection}>
            <View style={styles.expensesHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                Recent Expenses
              </Text>
              <Badge label={`${expenses.length} items`} variant="default" size="sm" />
            </View>

            {expenses.map((expense) => {
              const catColor = resolvedCategoryColour(expense.category === 'activities' ? 'culture' : expense.category as any);
              return (
                <View
                  key={expense.id}
                  style={[styles.expenseRow, { backgroundColor: theme.bg_surface, borderColor: theme.border_default }]}
                >
                  <View style={[styles.expenseCatDot, { backgroundColor: catColor }]} />
                  <View style={styles.expenseInfo}>
                    <Text style={[styles.expenseName, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                      {expense.description ?? CAT_LABELS[expense.category]}
                    </Text>
                    <Text style={[styles.expenseMeta, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                      {CAT_LABELS[expense.category]} · {new Date(expense.loggedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.expenseAmounts}>
                    <Text style={[styles.expenseAmount, { color: theme.text_primary, fontFamily: theme.font_body_medium }]}>
                      {expense.currency} {expense.amount.toLocaleString()}
                    </Text>
                    {expense.currency !== 'GBP' && expense.amountInBase && (
                      <Text style={[styles.expenseBase, { color: theme.text_disabled, fontFamily: theme.font_body }]}>
                        £{expense.amountInBase.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Log Expense FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.brand_lime }]}
          onPress={() => setShowLogModal(true)}
        >
          <Text style={[styles.fabText, { color: theme.bg_primary }]}>+ Log Expense</Text>
        </TouchableOpacity>

        {/* Log Expense Modal */}
        <Modal visible={showLogModal} transparent animationType="slide">
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableOpacity style={styles.modalBg} onPress={() => setShowLogModal(false)} />
            <View style={[styles.modalSheet, { backgroundColor: theme.bg_surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text_primary, fontFamily: theme.font_display }]}>
                Log Expense
              </Text>

              <View style={styles.amountRow}>
                <View style={{ width: 80 }}>
                  <RNTextInput
                    style={[styles.input, { color: theme.text_primary, borderColor: theme.border_default, backgroundColor: theme.bg_raised, fontFamily: theme.font_mono }]}
                    value={expenseCurrency}
                    onChangeText={setExpenseCurrency}
                    placeholder="GBP"
                    placeholderTextColor={theme.text_disabled}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <RNTextInput
                    style={[styles.input, { color: theme.text_primary, borderColor: theme.border_default, backgroundColor: theme.bg_raised, fontFamily: theme.font_body, fontSize: 18 }]}
                    value={expenseAmount}
                    onChangeText={setExpenseAmount}
                    placeholder="0.00"
                    placeholderTextColor={theme.text_disabled}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: theme.text_secondary, fontFamily: theme.font_body }]}>
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catPicker}>
                {(Object.entries(CAT_LABELS) as [ExpenseCategory, string][]).map(([cat, label]) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catBtn,
                      {
                        backgroundColor: expenseCategory === cat ? `${theme.brand_lime}20` : theme.bg_raised,
                        borderColor: expenseCategory === cat ? theme.brand_lime : theme.border_default,
                      },
                    ]}
                    onPress={() => setExpenseCategory(cat)}
                  >
                    <Text style={[styles.catBtnText, { color: expenseCategory === cat ? theme.brand_lime : theme.text_secondary, fontFamily: theme.font_body }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <RNTextInput
                style={[styles.input, { color: theme.text_primary, borderColor: theme.border_default, backgroundColor: theme.bg_raised, fontFamily: theme.font_body }]}
                value={expenseDescription}
                onChangeText={setExpenseDescription}
                placeholder="Description (optional)"
                placeholderTextColor={theme.text_disabled}
              />

              {expenseAmount && expenseCurrency !== 'GBP' && (
                <Text style={[styles.convertNote, { color: theme.brand_cyan, fontFamily: theme.font_body }]}>
                  ≈ £{(parseFloat(expenseAmount || '0') / (EXCHANGE_RATES[expenseCurrency] ?? 1)).toFixed(2)} GBP
                </Text>
              )}

              <View style={styles.modalActions}>
                <Button label="Cancel" variant="ghost" onPress={() => setShowLogModal(false)} />
                <Button label="Log Expense" variant="primary" onPress={logExpense} disabled={!expenseAmount} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  scrollContent: { gap: 16, paddingBottom: 16 },
  converterCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  ratesRow: { gap: 10 },
  rateChip: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  rateCode: { fontSize: 11, marginBottom: 4 },
  rateValue: { fontSize: 20, fontWeight: '700' },
  rateLabel: { fontSize: 10, marginTop: 2 },
  expensesSection: { gap: 10 },
  expensesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  expenseCatDot: { width: 10, height: 10, borderRadius: 5 },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 14 },
  expenseMeta: { fontSize: 12, marginTop: 2 },
  expenseAmounts: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 14 },
  expenseBase: { fontSize: 11, marginTop: 2 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fabText: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBg: { flex: 1 },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  amountRow: { flexDirection: 'row', gap: 10 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  fieldLabel: { fontSize: 13 },
  catPicker: { gap: 8 },
  catBtn: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  catBtnText: { fontSize: 13 },
  convertNote: { fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
});
