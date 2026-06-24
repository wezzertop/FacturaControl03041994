'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { 
  Wallet, Plus, Trash2, ArrowUpRight, ArrowDownLeft, Calendar, 
  DollarSign, Tag, Receipt, Building2, CheckCircle2, X, PlusCircle,
  FileImage, Eye, RefreshCw, Upload,
  ShoppingCart, Fuel, Zap, HeartPulse, Utensils, MoreHorizontal,
  Tv, GraduationCap, Gift, PiggyBank, CreditCard, Coins, Edit
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { 
  createWallet, updateWallet, deleteWallet, createTransaction, 
  deleteTransaction, linkInvoiceToWallet, getVoucherUrl 
} from '@/app/actions/wallets';
import { createCategory } from '@/app/actions/categories';

// Mapeo simple de iconos para la creación de categorías en la modal
const InlineIconMap: Record<string, any> = {
  ShoppingCart,
  Fuel,
  Zap,
  HeartPulse,
  Utensils,
  MoreHorizontal,
  Tv,
  GraduationCap,
  Gift,
  PiggyBank
};

// Paleta de colores Tailwind
const ColorPalette = [
  { class: 'bg-brand-cerulean', name: 'Cerúleo' },
  { class: 'bg-blue-400', name: 'Azul Claro' },
  { class: 'bg-emerald-500', name: 'Verde' },
  { class: 'bg-red-400', name: 'Rojo' },
  { class: 'bg-orange-400', name: 'Naranja' },
  { class: 'bg-purple-500', name: 'Púrpura' },
  { class: 'bg-gray-400', name: 'Gris' },
];

interface WalletsManagerProps {
  initialWallets: any[];
  initialTransactions: any[];
  initialUnlinkedInvoices: any[];
  categories: any[];
}

export default function WalletsManager({ 
  initialWallets, 
  initialTransactions, 
  initialUnlinkedInvoices,
  categories 
}: WalletsManagerProps) {
  const [wallets, setWallets] = useState(initialWallets);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [unlinkedInvoices, setUnlinkedInvoices] = useState(initialUnlinkedInvoices);
  const [isPending, startTransition] = useTransition();

  // Trigger por URL params (Bottom Navigation móvil)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('triggerOcr') === 'true') {
        const fileInput = document.getElementById('ocr-file-input');
        if (fileInput) {
          (fileInput as HTMLInputElement).click();
          // Limpiar URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (params.get('triggerTx') === 'true') {
        if (wallets.length > 0) {
          setTxWalletId(wallets[0].id);
          setVoucherFile(null);
          setShowTxModal(true);
          // Limpiar URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [wallets]);

  // Estados de OCR y Comprobantes
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [viewingVoucherUrl, setViewingVoucherUrl] = useState<string | null>(null);

  // Modales
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Estados de formularios
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [editingWallet, setEditingWallet] = useState<any | null>(null);
  const [walletType, setWalletType] = useState<'cash' | 'debit' | 'credit'>('debit');
  const [creditLimit, setCreditLimit] = useState('');

  const [txWalletId, setTxWalletId] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txConcept, setTxConcept] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');

  // Categorías locales e inline form
  const [localCategories, setLocalCategories] = useState(categories);
  const [showInlineCategoryForm, setShowInlineCategoryForm] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');
  const [inlineCatColor, setInlineCatColor] = useState('bg-brand-cerulean');
  const [inlineCatIcon, setInlineCatIcon] = useState('ShoppingCart');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlinePending, setInlinePending] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [linkWalletId, setLinkWalletId] = useState('');
  const [ignoreBalanceEffect, setIgnoreBalanceEffect] = useState(false);

  // Filtros
  const [activeWalletFilter, setActiveWalletFilter] = useState<string | null>(null);

  // Re-calcular balances locales y totales
  const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);

  // Formateadores
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Convertir archivo a Base64
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Parser de texto extraído del comprobante de transferencia BBVA
  const parseBBVATransfer = (text: string) => {
    const result = {
      amount: '',
      concept: '',
      origin: '',
      reference: ''
    };

    // 1. Extraer Monto ($5,000.00 o $ 5,000.00 o similar)
    const amountMatch = text.match(/\$\s*([0-9,]+\.[0-9]{2})/);
    if (amountMatch) {
      result.amount = amountMatch[1].replace(/,/g, '');
    }

    // 2. Extraer Concepto
    const conceptMatch = text.match(/Concepto\s+(.+)/i);
    if (conceptMatch) {
      result.concept = conceptMatch[1].trim();
    }

    // 3. Extraer Referencia
    const referenceMatch = text.match(/Referencia\s+(\d+)/i);
    if (referenceMatch) {
      result.reference = referenceMatch[1].trim();
    }

    // 4. Extraer Origen
    const originMatch = text.match(/Origen\s+(.+)/i);
    if (originMatch) {
      result.origin = originMatch[1].trim();
    }

    return result;
  };

  // Procesamiento OCR de la imagen de comprobante
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processVoucher(file);
  };

  const processVoucher = async (file: File) => {
    setIsOcrLoading(true);
    setOcrProgress('Cargando motor de lectura...');
    try {
      const worker = await createWorker('spa');
      setOcrProgress('Escaneando comprobante...');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      console.log('OCR Raw Text:', text);
      const parsedData = parseBBVATransfer(text);
      console.log('Parsed Data:', parsedData);

      // Guardar el archivo temporalmente
      setVoucherFile(file);

      // Pre-llenar el formulario de transacción
      if (parsedData.amount) {
        setTxAmount(parsedData.amount);
      }
      
      let finalConcept = parsedData.concept || 'Transferencia BBVA';
      if (parsedData.reference) {
        finalConcept += ` (Ref: ${parsedData.reference})`;
      }
      setTxConcept(finalConcept);
      setTxType('expense');

      // Intentar mapear cuenta de origen (BBVA o los últimos dígitos)
      if (parsedData.origin) {
        const originClean = parsedData.origin.toLowerCase();
        const matchedWallet = wallets.find(w => {
          const nameLower = w.name.toLowerCase();
          const lastDigitsMatch = originClean.match(/\d{4}$/);
          if (lastDigitsMatch && nameLower.includes(lastDigitsMatch[0])) {
            return true;
          }
          return nameLower.includes('bbva') || nameLower.includes('ahorro') || nameLower.includes('tarjeta');
        });

        if (matchedWallet) {
          setTxWalletId(matchedWallet.id);
        } else if (wallets.length > 0) {
          setTxWalletId(wallets[0].id);
        }
      } else if (wallets.length > 0) {
        setTxWalletId(wallets[0].id);
      }

      setTxCategoryId('');
      setShowTxModal(true);
    } catch (err) {
      console.error('Error during OCR processing:', err);
      alert('Hubo un error al leer la imagen. Puedes registrar el movimiento a mano.');
    } finally {
      setIsOcrLoading(false);
      setOcrProgress('');
    }
  };

  // Crear Cartera
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;

    const initialBal = parseFloat(newWalletBalance) || 0;
    const limitNum = parseFloat(creditLimit) || 0;

    startTransition(async () => {
      const res = await createWallet(newWalletName, walletType, initialBal, limitNum);
      if (res.success && res.wallet) {
        const createdWallet = res.wallet;
        setWallets([...wallets, createdWallet]);
        
        if (initialBal !== 0) {
          const isCredit = walletType === 'credit';
          const newTx = {
            id: Math.random().toString(),
            wallet_id: createdWallet.id,
            type: isCredit ? 'expense' : (initialBal > 0 ? 'income' : 'expense'),
            amount: Math.abs(initialBal),
            concept: isCredit ? 'Deuda inicial' : 'Saldo inicial',
            date: new Date().toISOString(),
            wallets: { name: newWalletName }
          };
          setTransactions([newTx, ...transactions]);
        }
        
        // El trigger recalcula balance
        const updatedWallet = { ...createdWallet, balance: walletType === 'credit' ? -Math.abs(initialBal) : initialBal };
        setWallets(prev => prev.map(w => w.id === createdWallet.id ? updatedWallet : w));

        setShowWalletModal(false);
        setNewWalletName('');
        setNewWalletBalance('');
        setWalletType('debit');
        setCreditLimit('');
      } else {
        alert(res.error || 'Error al crear la cartera');
      }
    });
  };

  // Actualizar Cartera
  const handleUpdateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || !newWalletName.trim()) return;

    const targetBal = parseFloat(newWalletBalance) || 0;
    const limitNum = parseFloat(creditLimit) || 0;

    startTransition(async () => {
      const res = await updateWallet(editingWallet.id, newWalletName, walletType, limitNum, targetBal);
      if (res.success && res.wallet) {
        const updated = res.wallet;
        
        const currentBal = Number(editingWallet.balance);
        const diff = targetBal - currentBal;
        if (diff !== 0) {
          const newTx = {
            id: Math.random().toString(),
            wallet_id: updated.id,
            type: diff > 0 ? 'income' : 'expense',
            amount: Math.abs(diff),
            concept: 'Ajuste de saldo manual',
            date: new Date().toISOString(),
            wallets: { name: newWalletName }
          };
          setTransactions([newTx, ...transactions]);
        }

        setWallets(prev => prev.map(w => w.id === updated.id ? updated : w));
        
        setShowWalletModal(false);
        setEditingWallet(null);
        setNewWalletName('');
        setNewWalletBalance('');
        setWalletType('debit');
        setCreditLimit('');
      } else {
        alert(res.error || 'Error al actualizar la cartera');
      }
    });
  };

  const handleCloseWalletModal = () => {
    setShowWalletModal(false);
    setEditingWallet(null);
    setNewWalletName('');
    setNewWalletBalance('');
    setWalletType('debit');
    setCreditLimit('');
  };

  const handleOpenNewWalletModal = () => {
    setEditingWallet(null);
    setNewWalletName('');
    setNewWalletBalance('');
    setWalletType('debit');
    setCreditLimit('');
    setShowWalletModal(true);
  };

  // Eliminar Cartera
  const handleDeleteWallet = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la cartera "${name}"? Se perderán todas sus transacciones vinculadas.`)) return;

    startTransition(async () => {
      const res = await deleteWallet(id);
      if (res.success) {
        setWallets(wallets.filter(w => w.id !== id));
        setTransactions(transactions.filter(t => t.wallet_id !== id));
        if (activeWalletFilter === id) setActiveWalletFilter(null);
      } else {
        alert(res.error);
      }
    });
  };

  // Crear Categoría Inline desde el Modal
  const handleCreateInlineCategory = async () => {
    if (!inlineCatName.trim()) return;
    setInlineError(null);
    setInlinePending(true);

    try {
      const res = await createCategory(inlineCatName, inlineCatColor, inlineCatIcon);
      if (res.success && res.category) {
        const newCat = res.category;
        setLocalCategories((prev) => [...prev, newCat]);
        setTxCategoryId(newCat.id);
        setShowInlineCategoryForm(false);
        setInlineCatName('');
        setInlineCatColor('bg-brand-cerulean');
        setInlineCatIcon('ShoppingCart');
      } else {
        setInlineError(res.error || 'No se pudo crear la categoría.');
      }
    } catch (err) {
      console.error(err);
      setInlineError('Ocurrió un error al crear la categoría. Asegúrate de ejecutar la migración.');
    } finally {
      setInlinePending(false);
    }
  };

  // Registrar Transacción Manual (con comprobante si aplica)
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txWalletId || !txAmount || !txConcept) return;

    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    startTransition(async () => {
      let voucher_base64: string | null = null;
      let voucher_name: string | null = null;

      if (voucherFile) {
        try {
          voucher_base64 = await getBase64(voucherFile);
          voucher_name = voucherFile.name;
        } catch (err) {
          console.error('Error al convertir comprobante a base64:', err);
        }
      }

      const res = await createTransaction({
        wallet_id: txWalletId,
        type: txType,
        amount: amountNum,
        concept: txConcept,
        category_id: txCategoryId || null,
        voucher_base64,
        voucher_name
      });

      if (res.success) {
        const selectedWallet = wallets.find(w => w.id === txWalletId);
        const selectedCategory = localCategories.find(c => c.id === txCategoryId);

        // Mapear localmente para actualizar estado inmediato sin recarga
        const newTx = {
          id: Math.random().toString(),
          wallet_id: txWalletId,
          type: txType,
          amount: amountNum,
          concept: txConcept,
          date: new Date().toISOString(),
          wallets: { name: selectedWallet?.name || 'Cartera' },
          categories: selectedCategory ? { name: selectedCategory.name, color: selectedCategory.color } : null,
          voucher_url: voucherFile ? 'comprobante_cargado' : null // marcador temporal local
        };

        setTransactions([newTx, ...transactions]);

        setWallets(prev => prev.map(w => {
          if (w.id === txWalletId) {
            const diff = txType === 'income' ? amountNum : -amountNum;
            return { ...w, balance: Number(w.balance) + diff };
          }
          return w;
        }));

        setShowTxModal(false);
        setTxAmount('');
        setTxConcept('');
        setTxCategoryId('');
        setVoucherFile(null);
      } else {
        alert(res.error);
      }
    });
  };

  // Eliminar Transacción
  const handleDeleteTransaction = async (id: string, walletId: string, type: 'income' | 'expense', amount: number) => {
    const txToDelete = transactions.find(t => t.id === id);
    const hasInvoice = !!(txToDelete && txToDelete.invoices);
    
    const confirmMessage = hasInvoice
      ? 'Este movimiento está vinculado a una factura del SAT. Al eliminarlo, se desconciliará y la factura volverá a la lista de "Facturas sin Conciliar", y el saldo se revertirá. ¿Deseas continuar?'
      : '¿Deseas eliminar este movimiento? Su saldo se revertirá en la cartera.';

    if (!confirm(confirmMessage)) return;

    startTransition(async () => {
      const res = await deleteTransaction(id);
      if (res.success) {
        setTransactions(transactions.filter(t => t.id !== id));
        setWallets(prev => prev.map(w => {
          if (w.id === walletId) {
            const diff = type === 'income' ? -amount : amount;
            return { ...w, balance: Number(w.balance) + diff };
          }
          return w;
        }));

        // Restaurar factura en el listado de facturas sin conciliar
        if (txToDelete && txToDelete.invoices) {
          setUnlinkedInvoices(prev => [txToDelete.invoices, ...prev]);
        }
      } else {
        alert(res.error);
      }
    });
  };

  // Vincular Factura XML a Cartera
  const handleLinkInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !linkWalletId) return;

    startTransition(async () => {
      const res = await linkInvoiceToWallet(selectedInvoice.id, linkWalletId, ignoreBalanceEffect);
      if (res.success) {
        setUnlinkedInvoices(unlinkedInvoices.filter(inv => inv.id !== selectedInvoice.id));
        
        const targetWallet = wallets.find(w => w.id === linkWalletId);
        const isIncome = selectedInvoice.invoice_type === 'nomina' || selectedInvoice.invoice_type === 'ingreso';
        const type = isIncome ? 'income' : 'expense';
        const prefix = isIncome 
          ? (selectedInvoice.invoice_type === 'nomina' ? 'Depósito de Nómina' : 'Ingreso Facturado')
          : 'Pago Facturado';

        const finalConcept = ignoreBalanceEffect 
          ? `${prefix}: ${selectedInvoice.nombre_emisor} (Sin afectar saldo)`
          : `${prefix}: ${selectedInvoice.nombre_emisor}`;

        const newTx = {
          id: Math.random().toString(),
          wallet_id: linkWalletId,
          type,
          amount: ignoreBalanceEffect ? 0 : Number(selectedInvoice.total),
          concept: finalConcept,
          date: selectedInvoice.fecha,
          wallets: { name: targetWallet?.name || 'Cartera' },
          categories: selectedInvoice.categories ? { name: selectedInvoice.categories.name, color: selectedInvoice.categories.color } : null,
          invoices: { total: selectedInvoice.total },
          voucher_url: null
        };

        setTransactions([newTx, ...transactions]);

        setWallets(prev => prev.map(w => {
          if (w.id === linkWalletId) {
            const diff = ignoreBalanceEffect
              ? 0
              : (type === 'income' ? Number(selectedInvoice.total) : -Number(selectedInvoice.total));
            return { ...w, balance: Number(w.balance) + diff };
          }
          return w;
        }));

        setShowLinkModal(false);
        setSelectedInvoice(null);
        setLinkWalletId('');
        setIgnoreBalanceEffect(false);
      } else {
        alert(res.error);
      }
    });
  };

  // Abrir visor de comprobantes
  const handleViewVoucher = async (filePath: string) => {
    if (filePath === 'comprobante_cargado') {
      alert("El comprobante se cargó con éxito. Estará disponible para visualización completa una vez que refresques la página.");
      return;
    }
    
    startTransition(async () => {
      const url = await getVoucherUrl(filePath);
      if (url) {
        setViewingVoucherUrl(url);
      } else {
        alert("No se pudo obtener la imagen del comprobante.");
      }
    });
  };

  // Filtrado de transacciones
  const filteredTransactions = activeWalletFilter
    ? transactions.filter(t => t.wallet_id === activeWalletFilter)
    : transactions;

  return (
    <div className="space-y-8">
      
      {/* 1. Resumen Consolidado */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6 md:p-8 shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cerulean/15 dark:bg-brand-cerulean/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-graphite dark:text-zinc-500">
              Saldo Neto Consolidado
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-brand-carbon dark:text-white mt-1">
              {formatCurrency(totalBalance)}
            </h2>
            <p className="text-xs text-brand-graphite dark:text-zinc-500 mt-2">
              Suma total de todas tus carteras activas en pesos mexicanos (MXN).
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
              id="trigger-tx-modal-btn"
              onClick={() => {
                if (wallets.length === 0) {
                  alert("Primero crea una cartera para registrar transacciones.");
                  return;
                }
                setTxWalletId(wallets[0].id);
                setVoucherFile(null);
                setShowTxModal(true);
              }}
              className="w-full sm:w-auto bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Movimiento
            </button>
            <button 
              onClick={() => handleOpenNewWalletModal()}
              className="w-full sm:w-auto border border-gray-200 dark:border-zinc-800 bg-brand-white dark:bg-brand-graphite text-brand-carbon dark:text-zinc-300 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800/80 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Nueva Cuenta
            </button>
          </div>
        </div>
      </div>

      {/* 2. Zona de Escaneo de Comprobantes (BBVA OCR) */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-bold text-brand-carbon dark:text-white text-base flex items-center gap-2">
              <FileImage className="w-5 h-5 text-brand-cerulean" />
              Escáner de Transferencias (OCR)
            </h3>
            <p className="text-xs text-brand-graphite dark:text-zinc-400">
              Sube la captura de pantalla de tu transferencia bancaria (BBVA) y el sistema la registrará automáticamente.
            </p>
          </div>
          
          <div className="w-full md:w-auto">
            {isOcrLoading ? (
              <div className="flex items-center gap-3 bg-brand-cerulean/10 text-brand-cerulean px-6 py-4 rounded-xl border border-brand-cerulean/30 min-w-[240px] justify-center">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-xs font-bold">{ocrProgress}</span>
              </div>
            ) : (
              <label className="flex items-center gap-3 bg-brand-cerulean hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm shadow-brand-cerulean/20 w-full md:w-auto justify-center active:scale-98">
                <Upload className="w-4 h-4" />
                Subir captura de transferencia
                <input 
                  id="ocr-file-input"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* 3. Grid de Carteras */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-carbon dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-cerulean" />
            Mis Cuentas y Cartera
          </h3>
          {activeWalletFilter && (
            <button 
              onClick={() => setActiveWalletFilter(null)}
              className="text-xs text-brand-cerulean font-semibold hover:underline"
            >
              Mostrar todas
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet) => {
            const isActive = activeWalletFilter === wallet.id;
            
            // Elegir icono según el tipo
            let WalletIcon = Wallet;
            let typeLabel = 'Cuenta';
            if (wallet.type === 'cash') {
              WalletIcon = Coins;
              typeLabel = 'Efectivo';
            } else if (wallet.type === 'credit') {
              WalletIcon = CreditCard;
              typeLabel = 'Crédito';
            } else if (wallet.type === 'debit') {
              WalletIcon = Building2;
              typeLabel = 'Débito / Ahorro';
            }

            return (
              <div 
                key={wallet.id}
                onClick={() => setActiveWalletFilter(isActive ? null : wallet.id)}
                className={`relative overflow-hidden rounded-xl border p-5 transition-all cursor-pointer group flex flex-col justify-between h-36 ${
                  isActive 
                    ? 'border-brand-cerulean bg-brand-cerulean/5 dark:bg-brand-cerulean/10 shadow-md ring-1 ring-brand-cerulean' 
                    : 'border-gray-200 dark:border-zinc-800 bg-brand-white dark:bg-brand-graphite hover:border-gray-300 dark:hover:border-zinc-700 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-2.5 items-start">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-brand-cerulean/10 text-brand-cerulean' : 'bg-gray-100 dark:bg-zinc-800 text-brand-graphite dark:text-zinc-400'}`}>
                      <WalletIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-carbon dark:text-white text-sm line-clamp-1">
                        {wallet.name}
                      </h4>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-brand-graphite dark:text-zinc-500 block">
                        {typeLabel} ({wallet.currency})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Abrir modal de edición
                        setEditingWallet(wallet);
                        setNewWalletName(wallet.name);
                        setNewWalletBalance(wallet.balance.toString());
                        setWalletType(wallet.type || 'debit');
                        setCreditLimit(wallet.credit_limit ? wallet.credit_limit.toString() : '0');
                        setShowWalletModal(true);
                      }}
                      className="p-1.5 rounded-lg text-brand-graphite dark:text-zinc-400 hover:text-brand-cerulean dark:hover:text-brand-cerulean/80 hover:bg-brand-cerulean/10 transition-all"
                      title="Editar Cartera"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWallet(wallet.id, wallet.name);
                      }}
                      className="p-1.5 rounded-lg text-brand-graphite dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                      title="Eliminar Cartera"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2.5">
                  {wallet.type === 'credit' ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-brand-graphite dark:text-zinc-400 font-semibold uppercase">Deuda</span>
                        <span className="text-lg font-black text-red-500 tracking-tight">
                          {formatCurrency(Math.abs(Number(wallet.balance)))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-brand-graphite dark:text-zinc-500 font-semibold">
                        <span>Disp: {formatCurrency(Number(wallet.credit_limit) + Number(wallet.balance))}</span>
                        <span>Lím: {formatCurrency(Number(wallet.credit_limit))}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-brand-graphite dark:text-zinc-400 font-semibold uppercase">Saldo Disponible</span>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                        {formatCurrency(Number(wallet.balance))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div 
            onClick={() => handleOpenNewWalletModal()}
            className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center h-36 hover:border-brand-cerulean hover:bg-brand-cerulean/5 dark:hover:bg-brand-cerulean/5 transition-all cursor-pointer text-brand-graphite dark:text-zinc-400 hover:text-brand-cerulean group"
          >
            <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold">Agregar Cartera / Cuenta</span>
          </div>
        </div>
      </div>

      {/* 4. Panel de Reconciliación (Doble Columna) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Historial de Transacciones */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-brand-carbon dark:text-white">
              Historial de Movimientos
              {activeWalletFilter && ` (${wallets.find(w => w.id === activeWalletFilter)?.name})`}
            </h3>
          </div>

          <div className="bg-brand-white dark:bg-brand-graphite border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800/80">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-brand-graphite dark:text-zinc-500">
                No hay movimientos registrados en esta cuenta.
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isIncome 
                          ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                      }`}>
                        {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-carbon dark:text-white truncate max-w-[170px] sm:max-w-[280px]">
                          {tx.concept}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-brand-graphite dark:text-zinc-500 font-medium">
                          <span>{tx.wallets?.name || 'Cuenta'}</span>
                          <span>â€¢</span>
                          <span>{formatDate(tx.date)}</span>
                          {tx.categories && (
                            <>
                              <span>â€¢</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${tx.categories.color}`}>
                                {tx.categories.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className={`font-bold text-sm ${
                          Number(tx.amount) === 0
                            ? 'text-gray-400 dark:text-zinc-500 line-through'
                            : isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-brand-carbon dark:text-white'
                        }`}>
                          {Number(tx.amount) === 0 ? '' : (isIncome ? '+' : '-')}{formatCurrency(Number(tx.amount) === 0 && tx.invoices?.total ? Number(tx.invoices.total) : Number(tx.amount))}
                        </p>
                        {Number(tx.amount) === 0 && (
                          <span className="text-[9px] font-semibold text-brand-graphite dark:text-zinc-500 block">
                            Sin afectar saldo
                          </span>
                        )}
                      </div>
                      
                      {tx.voucher_url && (
                        <button 
                          onClick={() => handleViewVoucher(tx.voucher_url)}
                          className="p-1.5 rounded bg-brand-cerulean/10 text-brand-cerulean hover:bg-brand-cerulean/20 transition-colors"
                          title="Ver Comprobante"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button 
                        onClick={() => handleDeleteTransaction(tx.id, tx.wallet_id, tx.type, Number(tx.amount))}
                        className="p-1 rounded text-brand-graphite dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Eliminar movimiento / Desconciliar factura"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Reconciliación de Facturas del SAT */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-brand-carbon dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand-cerulean" />
              Facturas sin Conciliar (SAT)
            </h3>
            <span className="text-xs bg-brand-cerulean/15 text-brand-cerulean font-bold px-2 py-0.5 rounded-full">
              {unlinkedInvoices.length} XMLs
            </span>
          </div>

          <div className="space-y-3">
            {unlinkedInvoices.length === 0 ? (
              <div className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-xl p-8 text-center text-brand-graphite dark:text-zinc-500 text-sm">
                ¡Todas tus facturas del SAT están conciliadas y vinculadas a tus carteras!
              </div>
            ) : (
              unlinkedInvoices.map((inv) => {
                const isNomina = inv.invoice_type === 'nomina';
                const isIngreso = inv.invoice_type === 'ingreso';
                const isIncome = isNomina || isIngreso;

                return (
                  <div 
                    key={inv.id}
                    className={`border rounded-xl p-4 bg-white dark:bg-zinc-900/60 shadow-sm space-y-3 transition-colors ${
                      isNomina 
                        ? 'border-emerald-200 dark:border-emerald-950 bg-emerald-50/10 dark:bg-emerald-950/5' 
                        : 'border-gray-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isNomina && (
                            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                              Nómina (Ingreso)
                            </span>
                          )}
                          {isIngreso && (
                            <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                              Ingreso Facturado
                            </span>
                          )}
                          {!isIncome && (
                            <span className="bg-gray-100 dark:bg-zinc-800 text-brand-graphite dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                              Gasto (XML)
                            </span>
                          )}
                          <span className="text-[10px] text-brand-graphite dark:text-zinc-500 font-medium">
                            {formatDate(inv.fecha)}
                          </span>
                        </div>
                        <h4 className="font-bold text-brand-carbon dark:text-white text-sm mt-1 leading-tight">
                          {inv.nombre_emisor}
                        </h4>
                        <p className="text-[11px] font-mono text-brand-graphite dark:text-zinc-500 mt-0.5">
                          RFC: {inv.rfc_emisor}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-base font-black ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-carbon dark:text-white'}`}>
                          {formatCurrency(Number(inv.total))}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                      <button 
                        onClick={() => {
                          if (wallets.length === 0) {
                            alert("Primero crea una cartera para poder vincular facturas.");
                            return;
                          }
                          setSelectedInvoice(inv);
                          setLinkWalletId(wallets[0].id);
                          setShowLinkModal(true);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md bg-brand-cerulean/10 text-brand-cerulean hover:bg-brand-cerulean/20 transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Conciliar / Depositar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. MODALES */}
      {/* ========================================================================= */}

      {/* Visor de Comprobantes de Transferencia */}
      {viewingVoucherUrl && (
        <div className="fixed inset-0 bg-brand-carbon/60 dark:bg-black/85 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 border-t sm:border border-gray-200 dark:border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-w-sm w-full p-6 pb-12 sm:pb-6 relative animate-slide-up sm:animate-none max-h-[85vh] overflow-y-auto">
            {/* Grab Handle for Mobile Bottom Sheet */}
            <div className="w-12 h-1.5 bg-gray-250 dark:bg-zinc-800 rounded-full mx-auto mb-4 sm:hidden" />
            
            <button 
              onClick={() => setViewingVoucherUrl(null)}
              className="absolute top-4 right-4 text-brand-graphite dark:text-zinc-400 hover:text-brand-carbon dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-brand-carbon dark:text-white mb-4">
              Comprobante de Transferencia
            </h3>
            <div className="relative aspect-[9/16] w-full rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800">
              <img src={viewingVoucherUrl} alt="Comprobante de Transferencia" className="object-contain w-full h-full" />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Cartera */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-brand-carbon/55 dark:bg-black/75 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-brand-white dark:bg-brand-graphite border-t sm:border border-gray-200 dark:border-zinc-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden p-6 pb-12 sm:p-6 relative animate-slide-up sm:animate-none max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Grab Handle for Mobile Bottom Sheet */}
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mb-4 sm:hidden" />

            <button 
              onClick={() => handleCloseWalletModal()}
              className="absolute top-4 right-4 text-brand-graphite dark:text-zinc-400 hover:text-brand-carbon dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-brand-carbon dark:text-white mb-6">
              {editingWallet ? 'Editar Cartera' : 'Crear Cartera o Cuenta'}
            </h3>

            <form onSubmit={editingWallet ? handleUpdateWallet : handleCreateWallet} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">Tipo de Cuenta</label>
                <select 
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value as any)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 md:py-2 text-base md:text-sm text-brand-carbon dark:text-white focus:outline-none focus:border-brand-cerulean transition-colors"
                >
                  <option value="debit">Tarjeta de Débito / Nómina</option>
                  <option value="cash">Efectivo</option>
                  <option value="credit">Tarjeta de Crédito</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">Nombre de la Cuenta</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Efectivo, Nómina Santander, Crédito BBVA"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 md:py-2 text-base md:text-sm text-brand-carbon dark:text-white placeholder:text-zinc-650 focus:outline-none focus:border-brand-cerulean transition-colors"
                />
              </div>

              {walletType === 'credit' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">Límite de Crédito ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 md:py-2 text-base md:text-sm text-brand-carbon dark:text-white placeholder:text-zinc-650 focus:outline-none focus:border-brand-cerulean transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">
                  {editingWallet 
                    ? (walletType === 'credit' ? 'Deuda Actual ($)' : 'Saldo Actual ($)') 
                    : (walletType === 'credit' ? 'Deuda Inicial ($)' : 'Saldo Inicial ($)')}
                </label>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 md:py-2 text-base md:text-sm text-brand-carbon dark:text-white placeholder:text-zinc-650 focus:outline-none focus:border-brand-cerulean transition-colors"
                />
              </div>

              <button 
                type="submit"
                disabled={isPending}
                className="w-full bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon py-3 md:py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {isPending ? 'Guardando...' : (editingWallet ? 'Guardar Cambios' : 'Crear Cartera')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Transacción Manual */}
      {showTxModal && (
        <div className="fixed inset-0 bg-brand-carbon/55 dark:bg-black/75 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-brand-white dark:bg-brand-graphite border-t sm:border border-gray-200 dark:border-zinc-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden p-6 pb-12 sm:p-6 relative animate-slide-up sm:animate-none max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Grab Handle for Mobile Bottom Sheet */}
            <div className="w-12 h-1.5 bg-gray-250 dark:bg-zinc-800 rounded-full mx-auto mb-4 sm:hidden" />

            <button 
              onClick={() => {
                setShowTxModal(false);
                setVoucherFile(null);
              }}
              className="absolute top-4 right-4 text-brand-graphite dark:text-zinc-400 hover:text-brand-carbon dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-brand-carbon dark:text-white mb-4">
              Registrar Movimiento
            </h3>

            {voucherFile && (
              <div className="mb-4 bg-brand-cerulean/10 border border-brand-cerulean/20 text-brand-cerulean rounded-xl p-3 flex items-center gap-3">
                <FileImage className="w-5 h-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{voucherFile.name}</p>
                  <p className="text-[10px] opacity-80">Comprobante detectado por OCR</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setVoucherFile(null)} 
                  className="p-1 rounded-full hover:bg-brand-cerulean/20 text-brand-cerulean shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    txType === 'expense' 
                      ? 'bg-brand-white dark:bg-brand-graphite text-red-500 shadow-sm' 
                      : 'text-brand-graphite dark:text-zinc-500'
                  }`}
                >
                  Gasto / Retiro
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    txType === 'income' 
                      ? 'bg-brand-white dark:bg-brand-graphite text-emerald-500 shadow-sm' 
                      : 'text-brand-graphite dark:text-zinc-500'
                  }`}
                >
                  Ingreso / Depósito
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">Cartera Origen/Destino</label>
                <select 
                  value={txWalletId}
                  onChange={(e) => setTxWalletId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 md:py-2 text-base md:text-sm text-brand-carbon dark:text-white focus:outline-none focus:border-brand-cerulean transition-colors"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({formatCurrency(Number(w.balance))})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">Monto ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 md:py-2 text-base md:text-sm text-brand-carbon dark:text-white placeholder:text-zinc-600 focus:outline-none focus:border-brand-cerulean transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">Concepto / Descripción</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Tacos cena, Propinas, Copias papelería"
                  value={txConcept}
                  onChange={(e) => setTxConcept(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 md:py-2 text-base md:text-sm text-brand-carbon dark:text-white placeholder:text-zinc-650 focus:outline-none focus:border-brand-cerulean transition-colors"
                />
              </div>

              {txType === 'expense' && (
                <>
                  {showInlineCategoryForm ? (
                    <div className="bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3.5 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-graphite dark:text-zinc-400">Nueva Categoría</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowInlineCategoryForm(false);
                            setInlineError(null);
                          }}
                          className="text-[10px] text-brand-graphite dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 font-bold"
                        >
                          Cancelar
                        </button>
                      </div>

                      {inlineError && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-2 font-medium">
                          {inlineError}
                        </p>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-brand-graphite dark:text-zinc-400">Nombre de la Categoría</label>
                        <input 
                          type="text"
                          required
                          maxLength={30}
                          placeholder="Ej. Mascotas, Suscripciones"
                          value={inlineCatName}
                          onChange={(e) => setInlineCatName(e.target.value)}
                          className="w-full bg-white dark:bg-brand-carbon border border-gray-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-brand-carbon dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-brand-cerulean focus:ring-1 focus:ring-brand-cerulean transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-brand-graphite dark:text-zinc-400 block">Color de Etiqueta</label>
                        <div className="flex flex-wrap gap-2">
                          {ColorPalette.map((color) => (
                            <button
                              key={color.class}
                              type="button"
                              onClick={() => setInlineCatColor(color.class)}
                              className={`w-5 h-5 rounded-full ${color.class} transition-all hover:scale-110 active:scale-95 ${
                                inlineCatColor === color.class ? 'ring-2 ring-brand-carbon dark:ring-white scale-110' : 'opacity-80'
                              }`}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-brand-graphite dark:text-zinc-400 block">Icono</label>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.keys(InlineIconMap).map((iconName) => {
                            const Icon = InlineIconMap[iconName];
                            return (
                              <button
                                key={iconName}
                                type="button"
                                onClick={() => setInlineCatIcon(iconName)}
                                className={`p-1.5 rounded-md border transition-all hover:bg-gray-100 dark:hover:bg-zinc-800 ${
                                  inlineCatIcon === iconName 
                                    ? 'border-brand-cerulean bg-brand-cerulean/10 text-brand-cerulean font-bold' 
                                    : 'border-gray-200 dark:border-zinc-800 text-brand-graphite dark:text-zinc-400'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button 
                        type="button"
                        disabled={inlinePending || !inlineCatName.trim()}
                        onClick={handleCreateInlineCategory}
                        className="w-full bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon py-2 rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {inlinePending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        Guardar Categoría
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">Categoría (Opcional)</label>
                        <button 
                          type="button"
                          onClick={() => setShowInlineCategoryForm(true)}
                          className="text-[11px] font-bold text-brand-cerulean hover:underline active:scale-95 transition-all"
                        >
                          + Crear Nueva
                        </button>
                      </div>
                      <select 
                        value={txCategoryId}
                        onChange={(e) => setTxCategoryId(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 md:py-2 text-base md:text-sm text-brand-carbon dark:text-white focus:outline-none focus:border-brand-cerulean transition-colors"
                      >
                        <option value="">Selecciona Categoría...</option>
                        {localCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <button 
                type="submit"
                disabled={isPending}
                className="w-full bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon py-3 md:py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {isPending ? 'Registrando...' : 'Registrar Movimiento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Vincular Factura XML */}
      {showLinkModal && selectedInvoice && (
        <div className="fixed inset-0 bg-brand-carbon/55 dark:bg-black/75 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-brand-white dark:bg-brand-graphite border-t sm:border border-gray-200 dark:border-zinc-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden p-6 pb-12 sm:p-6 relative animate-slide-up sm:animate-none max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Grab Handle for Mobile Bottom Sheet */}
            <div className="w-12 h-1.5 bg-gray-250 dark:bg-zinc-800 rounded-full mx-auto mb-4 sm:hidden" />

            <button 
              onClick={() => {
                setShowLinkModal(false);
                setSelectedInvoice(null);
                setIgnoreBalanceEffect(false);
              }}
              className="absolute top-4 right-4 text-brand-graphite dark:text-zinc-400 hover:text-brand-carbon dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-brand-carbon dark:text-white mb-2">
              Conciliar Factura XML
            </h3>
            <p className="text-xs text-brand-graphite dark:text-zinc-500 mb-6">
              Asocia esta factura a una cuenta para actualizar el saldo.
            </p>

            <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between items-center text-xs text-brand-graphite dark:text-zinc-500">
                <span>Proveedor / Emisor</span>
                <span className="font-semibold">{formatDate(selectedInvoice.fecha)}</span>
              </div>
              <p className="text-sm font-bold text-brand-carbon dark:text-white leading-tight">
                {selectedInvoice.nombre_emisor}
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-zinc-800/80 mt-2">
                <span className="text-xs text-brand-graphite dark:text-zinc-500">Total Facturado</span>
                <span className="text-sm font-black text-brand-cerulean">
                  {formatCurrency(Number(selectedInvoice.total))}
                </span>
              </div>
            </div>

            <form onSubmit={handleLinkInvoice} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-graphite dark:text-zinc-400">
                  {selectedInvoice.invoice_type === 'nomina' || selectedInvoice.invoice_type === 'ingreso'
                    ? '¿A qué cuenta se depositó el dinero?'
                    : '¿De qué cuenta se pagó este gasto?'
                  }
                </label>
                <select 
                  value={linkWalletId}
                  onChange={(e) => setLinkWalletId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 md:py-2 text-base md:text-sm text-brand-carbon dark:text-white focus:outline-none focus:border-brand-cerulean transition-colors"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({formatCurrency(Number(w.balance))})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="ignoreBalanceEffect"
                  checked={ignoreBalanceEffect}
                  onChange={(e) => setIgnoreBalanceEffect(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-zinc-800 text-brand-cerulean focus:ring-brand-cerulean bg-gray-50 dark:bg-zinc-900 cursor-pointer"
                />
                <label htmlFor="ignoreBalanceEffect" className="text-xs font-semibold text-brand-graphite dark:text-zinc-400 cursor-pointer select-none">
                  No afectar el saldo de la cartera (solo registrar)
                </label>
              </div>

              <button 
                type="submit"
                disabled={isPending}
                className="w-full bg-brand-carbon dark:bg-white text-white dark:text-brand-carbon py-3 md:py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
              >
                {isPending ? 'Vinculando...' : 'Confirmar Conciliación'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}



