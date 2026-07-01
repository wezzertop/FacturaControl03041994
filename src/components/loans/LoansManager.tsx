"use client";

import React, { useState, useTransition } from 'react';
import { 
  Landmark, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  RefreshCw,
  Percent,
  HelpCircle,
  PiggyBank,
  Check,
  X,
  Edit,
  Upload
} from 'lucide-react';
import { createLoan, deleteLoan, addLoanPayment, addLoanPrincipalPayment, updateLoan } from '@/app/actions/loans';

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
}

interface Loan {
  id: string;
  name: string;
  bank: string;
  contract_number?: string | null;
  clabe?: string | null;
  amount_granted: number;
  current_balance: number;
  interest_rate: number;
  total_payments: number;
  payments_made: number;
  frequency: 'days_14' | 'days_15' | 'monthly';
  payment_amount: number;
  start_date: string;
  wallet_id: string;
  is_active: boolean;
  wallets?: { name: string } | null;
  first_payment_date?: string;
  first_payment_amount?: number;
}

interface LoansManagerProps {
  initialLoans: Loan[];
  wallets: Wallet[];
  categories: Category[];
}

interface AmortizationRow {
  number: number;
  date: string;
  totalPayment: number;
  interest: number;
  iva: number;
  principal: number;
  remainingBalance: number;
  status: 'paid' | 'pending';
}

const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function LoansManager({ initialLoans, wallets, categories }: LoansManagerProps) {
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(
    initialLoans.length > 0 ? initialLoans[0].id : null
  );
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form para crear/editar préstamo
  const [name, setName] = useState('');
  const [bank, setBank] = useState('BBVA');
  const [contractNumber, setContractNumber] = useState('');
  const [clabe, setClabe] = useState('');
  const [amountGranted, setAmountGranted] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [totalPayments, setTotalPayments] = useState('144');
  const [frequency, setFrequency] = useState<'days_14' | 'days_15' | 'monthly'>('days_15');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [depositInWallet, setDepositInWallet] = useState(false);

  // Form cobro irregular opcional
  const [hasFirstIrregular, setHasFirstIrregular] = useState(false);
  const [firstPaymentDate, setFirstPaymentDate] = useState('');
  const [firstPaymentAmount, setFirstPaymentAmount] = useState('');

  // Form abono a capital
  const [capitalAmount, setCapitalAmount] = useState('');
  const [capitalWalletId, setCapitalWalletId] = useState(wallets[0]?.id || '');
  const [capitalDate, setCapitalDate] = useState(new Date().toISOString().split('T')[0]);

  // Archivos de Comprobantes
  const [paymentVoucherFile, setPaymentVoucherFile] = useState<File | null>(null);
  const [capitalVoucherFile, setCapitalVoucherFile] = useState<File | null>(null);

  const selectedLoan = loans.find(l => l.id === selectedLoanId) || null;

  // Generar tabla de amortización dinámica que se acorta del final al abonar a capital
  const generateAmortizationTable = (loan: Loan): AmortizationRow[] => {
    const table: AmortizationRow[] = [];
    
    const annualRate = Number(loan.interest_rate) / 100;
    let periodsPerYear = 12;
    if (loan.frequency === 'days_14') periodsPerYear = 26;
    else if (loan.frequency === 'days_15') periodsPerYear = 24;
    
    const ratePerPeriod = annualRate / periodsPerYear;
    
    let currentDate = loan.first_payment_date 
      ? new Date(loan.first_payment_date + 'T12:00:00') 
      : new Date(loan.start_date + 'T12:00:00');

    if (!loan.first_payment_date) {
      if (loan.frequency === 'days_14') currentDate.setDate(currentDate.getDate() + 14);
      else if (loan.frequency === 'days_15') currentDate.setDate(currentDate.getDate() + 15);
      else currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // 1. Generar pagos históricos ya realizados (historial lineal hasta payments_made)
    let remaining = Number(loan.amount_granted);
    
    for (let i = 1; i <= loan.payments_made; i++) {
      let payment = Number(loan.payment_amount);
      let interest = 0;
      let iva = 0;
      let principal = 0;

      if (i === 1 && loan.first_payment_amount !== undefined && Number(loan.first_payment_amount) > 0) {
        payment = Number(loan.first_payment_amount);
        iva = payment * (0.16 / 1.16);
        interest = payment - iva;
        principal = 0;
      } else {
        const grossInterest = remaining * ratePerPeriod;
        iva = grossInterest * 0.16;
        interest = grossInterest;
        
        const totalInterest = interest + iva;
        if (payment > totalInterest) {
          principal = payment - totalInterest;
        } else {
          principal = 0;
          payment = totalInterest;
        }

        if (principal > remaining) {
          principal = remaining;
          payment = principal + totalInterest;
        }
      }

      remaining = Math.max(0, remaining - principal);

      table.push({
        number: i,
        date: currentDate.toISOString().split('T')[0],
        totalPayment: Math.round(payment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        iva: Math.round(iva * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        remainingBalance: Math.round(remaining * 100) / 100,
        status: 'paid'
      });

      currentDate = new Date(currentDate);
      if (loan.frequency === 'days_14') currentDate.setDate(currentDate.getDate() + 14);
      else if (loan.frequency === 'days_15') currentDate.setDate(currentDate.getDate() + 15);
      else currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // 2. Para los pagos pendientes, el saldo remanente inicial es exactamente loan.current_balance.
    // Esto refleja directamente cualquier abono extraordinario a capital hecho hasta hoy.
    remaining = Number(loan.current_balance);

    if (remaining <= 0) {
      return table;
    }

    let pendingIndex = loan.payments_made + 1;
    // Continuar la tabla con el saldo restante hasta amortizarlo por completo a 0
    while (remaining > 0 && pendingIndex <= loan.total_payments) {
      let payment = Number(loan.payment_amount);
      const grossInterest = remaining * ratePerPeriod;
      const iva = grossInterest * 0.16;
      const interest = grossInterest;
      
      const totalInterest = interest + iva;
      let principal = 0;

      if (payment > totalInterest) {
        principal = payment - totalInterest;
      } else {
        principal = 0;
        payment = totalInterest;
      }

      if (principal > remaining) {
        principal = remaining;
        payment = principal + totalInterest;
      }

      remaining = Math.max(0, remaining - principal);

      table.push({
        number: pendingIndex,
        date: currentDate.toISOString().split('T')[0],
        totalPayment: Math.round(payment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        iva: Math.round(iva * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        remainingBalance: Math.round(remaining * 100) / 100,
        status: 'pending'
      });

      currentDate = new Date(currentDate);
      if (loan.frequency === 'days_14') currentDate.setDate(currentDate.getDate() + 14);
      else if (loan.frequency === 'days_15') currentDate.setDate(currentDate.getDate() + 15);
      else currentDate.setMonth(currentDate.getMonth() + 1);

      pendingIndex++;
    }

    return table;
  };

  const selectedAmortization = selectedLoan ? generateAmortizationTable(selectedLoan) : [];
  const nextPayment = selectedAmortization.find(r => r.status === 'pending');

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMessage('Escribe un alias para el préstamo.');
    if (!amountGranted || Number(amountGranted) <= 0) return setErrorMessage('El monto otorgado debe ser mayor a 0.');
    if (!currentBalance || Number(currentBalance) <= 0) return setErrorMessage('El saldo pendiente debe ser mayor a 0.');
    if (!interestRate || Number(interestRate) <= 0) return setErrorMessage('Ingresa una tasa de interés válida.');
    if (!paymentAmount || Number(paymentAmount) <= 0) return setErrorMessage('Ingresa una cuota de pago válida.');

    setErrorMessage(null);
    startTransition(async () => {
      const res = await createLoan({
        name: name.trim(),
        bank,
        contract_number: contractNumber.trim() || undefined,
        clabe: clabe.trim() || undefined,
        amount_granted: Number(amountGranted),
        current_balance: Number(currentBalance),
        interest_rate: Number(interestRate),
        total_payments: Number(totalPayments),
        frequency,
        payment_amount: Number(paymentAmount),
        start_date: startDate,
        wallet_id: walletId,
        depositInWallet,
        first_payment_date: hasFirstIrregular && firstPaymentDate ? firstPaymentDate : undefined,
        first_payment_amount: hasFirstIrregular && firstPaymentAmount ? Number(firstPaymentAmount) : undefined
      } as any);

      if (res.success && res.loan) {
        setIsAddModalOpen(false);
        const updated = [...loans, res.loan as Loan];
        setLoans(updated);
        setSelectedLoanId(res.loan.id);
        // Reset form
        setName('');
        setAmountGranted('');
        setCurrentBalance('');
        setInterestRate('');
        setPaymentAmount('');
        setContractNumber('');
        setClabe('');
        setHasFirstIrregular(false);
      } else {
        setErrorMessage(res.error || 'Error al guardar.');
      }
    });
  };

  const openEditModal = (loan: Loan) => {
    setName(loan.name);
    setBank(loan.bank);
    setContractNumber(loan.contract_number || '');
    setClabe(loan.clabe || '');
    setAmountGranted(loan.amount_granted.toString());
    setCurrentBalance(loan.current_balance.toString());
    setInterestRate(loan.interest_rate.toString());
    setTotalPayments(loan.total_payments.toString());
    setFrequency(loan.frequency);
    setPaymentAmount(loan.payment_amount.toString());
    setStartDate(loan.start_date);
    setWalletId(loan.wallet_id);
    
    if (loan.first_payment_date || loan.first_payment_amount) {
      setHasFirstIrregular(true);
      setFirstPaymentDate(loan.first_payment_date || '');
      setFirstPaymentAmount(loan.first_payment_amount?.toString() || '');
    } else {
      setHasFirstIrregular(false);
      setFirstPaymentDate('');
      setFirstPaymentAmount('');
    }
    
    setErrorMessage(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    if (!name.trim()) return setErrorMessage('Escribe un alias para el préstamo.');
    if (!amountGranted || Number(amountGranted) <= 0) return setErrorMessage('El monto otorgado debe ser mayor a 0.');
    if (!currentBalance || Number(currentBalance) < 0) return setErrorMessage('El saldo pendiente debe ser mayor o igual a 0.');
    if (!interestRate || Number(interestRate) <= 0) return setErrorMessage('Ingresa una tasa de interés válida.');
    if (!paymentAmount || Number(paymentAmount) <= 0) return setErrorMessage('Ingresa una cuota de pago válida.');

    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateLoan(selectedLoan.id, {
        name: name.trim(),
        bank,
        contract_number: contractNumber.trim() || null,
        clabe: clabe.trim() || null,
        amount_granted: Number(amountGranted),
        current_balance: Number(currentBalance),
        interest_rate: Number(interestRate),
        total_payments: Number(totalPayments),
        payments_made: selectedLoan.payments_made,
        frequency,
        payment_amount: Number(paymentAmount),
        wallet_id: walletId,
        is_active: selectedLoan.is_active
      });

      if (res.success && res.loan) {
        setIsEditModalOpen(false);
        const updated = loans.map(l => l.id === selectedLoan.id ? (res.loan as Loan) : l);
        setLoans(updated);
      } else {
        setErrorMessage(res.error || 'Error al actualizar.');
      }
    });
  };

  const handleDeleteLoan = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este préstamo? Esto borrará también todos los pagos registrados del historial y restaurará los saldos de tus carteras.')) return;
    
    startTransition(async () => {
      const res = await deleteLoan(id);
      if (res.success) {
        const updated = loans.filter(l => l.id !== id);
        setLoans(updated);
        setSelectedLoanId(updated.length > 0 ? updated[0].id : null);
      } else {
        alert(res.error || 'Error al eliminar');
      }
    });
  };

  const handleRecordPayment = async () => {
    if (!selectedLoan || !nextPayment) return;
    
    startTransition(async () => {
      let voucherBase64: string | null = null;
      let voucherName: string | null = null;

      if (paymentVoucherFile) {
        try {
          voucherBase64 = await getBase64(paymentVoucherFile);
          voucherName = paymentVoucherFile.name;
        } catch (err) {
          console.error("Error reading payment voucher:", err);
        }
      }

      const res = await addLoanPayment(
        selectedLoan.id,
        selectedLoan.wallet_id,
        nextPayment.totalPayment,
        nextPayment.number,
        nextPayment.principal,
        nextPayment.date,
        voucherBase64,
        voucherName
      );

      if (res.success) {
        const { getLoans } = await import('@/app/actions/loans');
        const data = await getLoans();
        setLoans(data as Loan[]);
        setIsPayModalOpen(false);
        setPaymentVoucherFile(null);
      } else {
        alert(res.error || 'Error al registrar pago');
      }
    });
  };

  const handleRecordCapitalPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !capitalAmount || Number(capitalAmount) <= 0) return;

    startTransition(async () => {
      let voucherBase64: string | null = null;
      let voucherName: string | null = null;

      if (capitalVoucherFile) {
        try {
          voucherBase64 = await getBase64(capitalVoucherFile);
          voucherName = capitalVoucherFile.name;
        } catch (err) {
          console.error("Error reading capital voucher:", err);
        }
      }

      const res = await addLoanPrincipalPayment(
        selectedLoan.id,
        capitalWalletId,
        Number(capitalAmount),
        capitalDate,
        voucherBase64,
        voucherName
      );

      if (res.success) {
        const { getLoans } = await import('@/app/actions/loans');
        const data = await getLoans();
        setLoans(data as Loan[]);
        setIsCapitalModalOpen(false);
        setCapitalAmount('');
        setCapitalVoucherFile(null);
      } else {
        alert(res.error || 'Error al registrar abono a capital');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
      
      {/* Sidebar: List of Loans */}
      <div className="space-y-4 lg:col-span-1">
        <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mis Préstamos</h4>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setIsAddModalOpen(true);
              }}
              className="p-1 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white rounded-lg transition"
              title="Registrar nuevo préstamo"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {loans.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
              <Landmark className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500">Sin préstamos activos</p>
              <p className="text-[9px] text-gray-400 mt-0.5">Registra uno para amortizar y planificar cobros.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {loans.map((loan) => (
                <button
                  key={loan.id}
                  type="button"
                  onClick={() => setSelectedLoanId(loan.id)}
                  className={`w-full text-left p-3.5 border rounded-xl flex items-center justify-between transition-all ${
                    loan.id === selectedLoanId
                      ? 'border-brand-cerulean bg-brand-cerulean/5'
                      : 'border-gray-150 dark:border-zinc-850 bg-transparent hover:bg-gray-50 dark:hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${
                      loan.id === selectedLoanId 
                        ? 'bg-brand-cerulean/10 text-brand-cerulean' 
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500'
                    }`}>
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{loan.name}</p>
                      <p className="text-[9px] text-gray-400 font-medium mt-0.5">{loan.bank}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${loan.id === selectedLoanId ? 'translate-x-0.5 text-brand-cerulean' : 'text-gray-300 dark:text-zinc-700'}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Panel: Loan Details & Amortization */}
      <div className="lg:col-span-2 space-y-6">
        {selectedLoan ? (
          <>
            {/* General Loan Info Card */}
            <div className="border border-gray-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/50 p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-brand-cerulean uppercase tracking-wider bg-brand-cerulean/10 px-2.5 py-1 rounded-full">
                    {selectedLoan.bank} • Crédito al consumo
                  </span>
                  <h3 className="text-xl font-black text-gray-950 dark:text-white mt-2">{selectedLoan.name}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Contratado el {new Date(selectedLoan.start_date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentVoucherFile(null);
                      setIsPayModalOpen(true);
                    }}
                    disabled={!nextPayment}
                    className="px-4 py-2 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Pagar Recibo {nextPayment?.number}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCapitalVoucherFile(null);
                      setIsCapitalModalOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                  >
                    <PiggyBank className="w-3.5 h-3.5" />
                    Abonar a Capital
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(selectedLoan)}
                    className="p-2 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-xl transition"
                    title="Editar datos del préstamo"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteLoan(selectedLoan.id)}
                    className="p-2 border border-red-100 dark:border-red-950 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
                    title="Eliminar préstamo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress and Balances */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-850">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saldo Pendiente</span>
                  <p className="text-lg font-black text-gray-950 dark:text-white">
                    ${selectedLoan.current_balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-gray-400">De un total de ${selectedLoan.amount_granted.toLocaleString('es-MX')}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pago Recurrente</span>
                  <p className="text-lg font-black text-gray-950 dark:text-white">
                    ${selectedLoan.payment_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-gray-400">
                    Frecuencia: {selectedLoan.frequency === 'days_14' ? 'Catorcenal' : selectedLoan.frequency === 'days_15' ? 'Quincenal' : 'Mensual'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tasa de Interés Anual</span>
                  <p className="text-lg font-black text-gray-950 dark:text-white">
                    {selectedLoan.interest_rate}%
                  </p>
                  <span className="text-[10px] text-gray-400">Tasa fija c/IVA</span>
                </div>
              </div>

              {/* Bar and payments details */}
              <div className="mt-6 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <span>Progreso de Amortización</span>
                  <span>
                    {selectedLoan.payments_made} / {selectedLoan.total_payments} pagos
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-cerulean transition-all duration-500 rounded-full" 
                    style={{ width: `${(selectedLoan.payments_made / selectedLoan.total_payments) * 100}%` }}
                  />
                </div>
                {selectedLoan.contract_number && (
                  <div className="flex gap-4 text-[10px] text-gray-400 font-medium pt-1">
                    <span>Contrato: <strong className="text-gray-600 dark:text-zinc-300">{selectedLoan.contract_number}</strong></span>
                    {selectedLoan.clabe && <span>CLABE: <strong className="text-gray-600 dark:text-zinc-300">{selectedLoan.clabe}</strong></span>}
                  </div>
                )}
              </div>
            </div>

            {/* Amortization Table */}
            <div className="border border-gray-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-900/50 p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Tabla de Amortización con IVA (16%)</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Calculada bajo el esquema de amortización francés.</p>
                </div>
                {nextPayment && (
                  <span className="text-[10px] font-bold text-brand-cerulean bg-brand-cerulean/10 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Próximo pago: {new Date(nextPayment.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto -mx-6 md:-mx-8">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-zinc-850 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 md:px-8 py-3.5">No.</th>
                      <th className="px-4 py-3.5">Fecha</th>
                      <th className="px-4 py-3.5 text-right">Pago Total</th>
                      <th className="px-4 py-3.5 text-right">Interés (IVA)</th>
                      <th className="px-4 py-3.5 text-right">Capital</th>
                      <th className="px-4 py-3.5 text-right">Saldo Insoluto</th>
                      <th className="px-6 md:px-8 py-3.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-zinc-900 text-xs">
                    {selectedAmortization.map((row) => (
                      <tr 
                        key={row.number}
                        className={`transition-colors ${
                          row.status === 'paid' 
                            ? 'text-gray-400 bg-gray-50/10 dark:bg-zinc-900/10' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-zinc-900/20'
                        }`}
                      >
                        <td className="px-6 md:px-8 py-3.5 font-semibold">#{row.number}</td>
                        <td className="px-4 py-3.5 font-medium">
                          {new Date(row.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-right text-gray-900 dark:text-white">
                          ${row.totalPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium">
                          ${row.interest.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-400">(${row.iva.toFixed(2)})</span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-right text-brand-cerulean">
                          ${row.principal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-right text-gray-900 dark:text-white">
                          ${row.remainingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 md:px-8 py-3.5 text-center">
                          {row.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <CheckCircle className="w-3 h-3" />
                              Pagado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <Clock className="w-3 h-3 animate-pulse" />
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="border border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl p-16 text-center bg-white dark:bg-zinc-900/20">
            <Landmark className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-800 dark:text-white">Selecciona un Préstamo</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Elige uno de tus créditos de la barra lateral para ver su tabla de amortización con IVA desglosado, saldo adeudado y abonos.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Agregar Préstamo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 my-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-zinc-900">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Landmark className="w-5 h-5 text-brand-cerulean" />
                Registrar Préstamo Bancario
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3 text-xs text-red-600 font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Concepto / Nombre del Préstamo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Mi préstamo de nómina BBVA"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Banco Emisor</label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Ej. BBVA"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Número de Contrato (Opcional)</label>
                  <input
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="Ej. 123456789"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">CLABE Interbancaria (Opcional)</label>
                  <input
                    type="text"
                    value={clabe}
                    onChange={(e) => setClabe(e.target.value)}
                    placeholder="18 dígitos"
                    maxLength={18}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Monto Otorgado / Crédito ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={amountGranted}
                      onChange={(e) => {
                        setAmountGranted(e.target.value);
                        if (!currentBalance) setCurrentBalance(e.target.value);
                      }}
                      placeholder="40000"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Saldo Pendiente Inicial ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(e.target.value)}
                      placeholder="40000"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Tasa de Interés Anual (% c/IVA)</label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="37.45"
                    step="0.01"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Frecuencia de Pago</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  >
                    <option value="days_14">Catorcenal (Cada 14 días)</option>
                    <option value="days_15">Quincenal (Cada 15 días)</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Cuota de Pago Fija ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="262.13"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Total de Recibos / Plazo</label>
                  <input
                    type="number"
                    value={totalPayments}
                    onChange={(e) => setTotalPayments(e.target.value)}
                    placeholder="144"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Fecha de Contratación</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Cartera de Cobro / Nómina</label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} (${w.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })})</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* broken period setting */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={hasFirstIrregular}
                    onChange={(e) => {
                      setHasFirstIrregular(e.target.checked);
                      if (e.target.checked && !firstPaymentDate) {
                        setFirstPaymentDate(startDate);
                      }
                    }}
                    className="w-4 h-4 text-brand-cerulean rounded border-gray-300"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    El primer pago es irregular (ej. sólo pago de intereses por broken period)
                  </span>
                </label>

                {hasFirstIrregular && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-dashed border-gray-200 dark:border-zinc-850 rounded-xl bg-gray-50/50 dark:bg-zinc-900/20">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Fecha del Primer Pago</label>
                      <input
                        type="date"
                        value={firstPaymentDate}
                        onChange={(e) => setFirstPaymentDate(e.target.value)}
                        className="w-full px-3.5 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:ring-1 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                        required={hasFirstIrregular}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Monto del Primer Pago ($)</label>
                      <input
                        type="number"
                        value={firstPaymentAmount}
                        onChange={(e) => setFirstPaymentAmount(e.target.value)}
                        placeholder="108.60"
                        className="w-full px-3.5 py-1.5 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-lg focus:ring-1 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                        required={hasFirstIrregular}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-zinc-900">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositInWallet}
                    onChange={(e) => setDepositInWallet(e.target.checked)}
                    className="w-4 h-4 text-brand-cerulean rounded border-gray-300"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Registrar el ingreso original del préstamo (${Number(amountGranted).toLocaleString('es-MX')}) como un depósito en mi cartera
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-xs font-semibold rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Guardar Préstamo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Préstamo */}
      {isEditModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 md:p-8 my-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-zinc-900">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Edit className="w-5 h-5 text-brand-cerulean" />
                Editar Préstamo: {selectedLoan.name}
              </h4>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3 text-xs text-red-600 font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleUpdateLoanSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Concepto / Nombre del Préstamo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Mi préstamo de nómina"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Banco Emisor</label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Ej. BBVA"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Número de Contrato (Opcional)</label>
                  <input
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="Ej. 123456789"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">CLABE Interbancaria (Opcional)</label>
                  <input
                    type="text"
                    value={clabe}
                    onChange={(e) => setClabe(e.target.value)}
                    placeholder="18 dígitos"
                    maxLength={18}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Monto Otorgado / Crédito ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={amountGranted}
                      onChange={(e) => setAmountGranted(e.target.value)}
                      placeholder="40000"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Saldo Pendiente Actual ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(e.target.value)}
                      placeholder="15000"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Tasa de Interés Anual (% c/IVA)</label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="37.45"
                    step="0.01"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Frecuencia de Pago</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  >
                    <option value="days_14">Catorcenal (Cada 14 días)</option>
                    <option value="days_15">Quincenal (Cada 15 días)</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Cuota de Pago Fija ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="262.13"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Total de Recibos / Plazo</label>
                  <input
                    type="number"
                    value={totalPayments}
                    onChange={(e) => setTotalPayments(e.target.value)}
                    placeholder="144"
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Fecha de Contratación</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Cartera de Cobro / Nómina</label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} (${w.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })})</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-xs font-semibold rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Actualizar Préstamo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pagar Recibo */}
      {isPayModalOpen && selectedLoan && nextPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-gray-250 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 md:p-8">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
              Registrar Pago de Recibo #{nextPayment.number}
            </h4>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
              ¿Deseas registrar el cobro del **Recibo #{nextPayment.number}** por un monto de **${nextPayment.totalPayment.toFixed(2)}**? 
              Se creará una transacción de egreso en tu cartera y disminuirá el capital adeudado en tu préstamo por **${nextPayment.principal.toFixed(2)}**.
            </p>

            <div className="flex flex-col space-y-1.5 mb-6">
              <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Upload className="w-3.5 h-3.5 text-brand-cerulean" />
                Subir Comprobante de Pago (Opcional)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setPaymentVoucherFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-cerulean/10 file:text-brand-cerulean hover:file:bg-brand-cerulean/20"
              />
              {paymentVoucherFile && (
                <p className="text-[10px] text-gray-500 font-semibold truncate mt-1">
                  Archivo: {paymentVoucherFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-zinc-900">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                disabled={isPending}
                className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-xs font-semibold rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={isPending}
                className="px-5 py-2 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Confirmar Pago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Abono a Capital */}
      {isCapitalModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-gray-250 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 md:p-8">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              Registrar Abono Extraordinario a Capital
            </h4>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">
              El total de este abono se restará de forma directa a tu capital adeudado actual, reduciendo los intereses de tus futuras quincenas.
            </p>

            <form onSubmit={handleRecordCapitalPayment} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Monto del Abono ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="number"
                    value={capitalAmount}
                    onChange={(e) => setCapitalAmount(e.target.value)}
                    placeholder="2000.00"
                    min="1"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-250 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Cartera de Pago</label>
                <select
                  value={capitalWalletId}
                  onChange={(e) => setCapitalWalletId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-250 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} (${w.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">Fecha del Abono</label>
                <input
                  type="date"
                  value={capitalDate}
                  onChange={(e) => setCapitalDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-gray-250 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-brand-cerulean focus:outline-none dark:text-white"
                  required
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Subir Comprobante del Abono (Opcional)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setCapitalVoucherFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600/10 file:text-emerald-600 hover:file:bg-emerald-600/20"
                />
                {capitalVoucherFile && (
                  <p className="text-[10px] text-gray-500 font-semibold truncate mt-1">
                    Archivo: {capitalVoucherFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-150 dark:border-zinc-900 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCapitalModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-gray-200 dark:border-zinc-800 text-xs font-semibold rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Registrar Abono
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
