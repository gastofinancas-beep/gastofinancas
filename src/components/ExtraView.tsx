import React, { useState } from 'react';
import { 
  ExtraProfileConfig, 
  DriverTrip, 
  DriverExpense, 
  DriverGoals, 
  FreelanceEntry, 
  FreelanceExpense, 
  FreelanceGoals, 
  WalletAccount
} from '../types';
import { ExtraDriverView } from './ExtraDriverView';
import { ExtraSetupModal } from './ExtraSetupModal';

interface ExtraViewProps {
  config: ExtraProfileConfig;
  onSaveConfig: (newConfig: ExtraProfileConfig) => void;
  // Driver Data
  driverTrips: DriverTrip[];
  driverExpenses: DriverExpense[];
  driverGoals: DriverGoals;
  onAddDriverTrip: (tripData: Omit<DriverTrip, 'id'>, editId?: string) => void;
  onDeleteDriverTrip: (tripId: string) => void;
  onAddDriverExpense: (expenseData: Omit<DriverExpense, 'id'>, editId?: string) => void;
  onDeleteDriverExpense: (expenseId: string) => void;
  onSaveDriverGoals: (newGoals: DriverGoals) => void;
  onSaveDriverShift: (
    trips: Omit<DriverTrip, 'id' | 'createdAt'>[],
    expenses: Omit<DriverExpense, 'id' | 'createdAt'>[]
  ) => void;
  // Freelance Data (Compatibilidade)
  freelanceEntries?: FreelanceEntry[];
  freelanceExpenses?: FreelanceExpense[];
  freelanceGoals?: FreelanceGoals;
  onOpenAddFreelanceEntry?: () => void;
  onOpenEditFreelanceEntry?: (entry: FreelanceEntry) => void;
  onDeleteFreelanceEntry?: (entryId: string) => void;
  onOpenAddFreelanceExpense?: () => void;
  onOpenEditFreelanceExpense?: (expense: FreelanceExpense) => void;
  onDeleteFreelanceExpense?: (expenseId: string) => void;
  onOpenFreelanceGoals?: () => void;
  onSaveFreelanceShift?: (
    entries: Omit<FreelanceEntry, 'id'>[],
    expenses: Omit<FreelanceExpense, 'id'>[]
  ) => void;
  // Common
  accounts: WalletAccount[];
  currentMonth: string;
  userEmail?: string;
  onNavigateToWallet?: () => void;
}

export function ExtraView({
  config,
  onSaveConfig,
  driverTrips,
  driverExpenses,
  driverGoals,
  onAddDriverTrip,
  onDeleteDriverTrip,
  onAddDriverExpense,
  onDeleteDriverExpense,
  onSaveDriverGoals,
  onSaveDriverShift,
  accounts,
  currentMonth,
  userEmail,
  onNavigateToWallet
}: ExtraViewProps) {
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  return (
    <div className="pb-8">
      <ExtraDriverView
        trips={driverTrips}
        expenses={driverExpenses}
        goals={driverGoals}
        config={{
          ...config,
          workType: 'motorista_app'
        }}
        accounts={accounts}
        currentMonth={currentMonth}
        userEmail={userEmail}
        onOpenSetup={() => setIsSetupOpen(true)}
        onAddTrip={onAddDriverTrip}
        onDeleteTrip={onDeleteDriverTrip}
        onAddExpense={onAddDriverExpense}
        onDeleteExpense={onDeleteDriverExpense}
        onSaveGoals={onSaveDriverGoals}
        onSaveShift={onSaveDriverShift}
        onNavigateToWallet={onNavigateToWallet}
      />

      {/* Setup Modal */}
      <ExtraSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        config={config}
        accounts={accounts}
        onSaveConfig={(newCfg) => {
          onSaveConfig(newCfg);
          setIsSetupOpen(false);
        }}
      />
    </div>
  );
}

export default ExtraView;
