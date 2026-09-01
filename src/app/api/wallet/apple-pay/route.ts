import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint de Webhook / Integración para Apple Pay y Google Wallet
 * Permite recibir transacciones automáticamente desde Atajos de iOS (Apple Shortcuts Automation) o webhooks.
 * Soporta tanto POST (JSON) como GET (Query Params) para máxima compatibilidad con iOS Shortcuts.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await handleApplePayTransaction(body);
  } catch (error: any) {
    console.error("[Apple Pay API Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Error al procesar Apple Pay" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const amount = searchParams.get("amount") || searchParams.get("monto");
    const merchant = searchParams.get("merchant") || searchParams.get("comercio") || "Apple Pay";
    const card = searchParams.get("card") || searchParams.get("tarjeta") || "Apple Pay";
    const userId = searchParams.get("userId") || searchParams.get("user");
    const type = searchParams.get("type") || "expense";

    return await handleApplePayTransaction({
      amount: amount ? parseFloat(amount) : 0,
      merchant: merchant || "Apple Pay",
      card: card || "Apple Pay",
      userId: userId || undefined,
      type: type || "expense"
    });
  } catch (error: any) {
    console.error("[Apple Pay GET API Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Error al procesar Apple Pay" }, { status: 500 });
  }
}

async function handleApplePayTransaction(data: {
  amount?: number;
  merchant?: string;
  card?: string;
  userId?: string;
  type?: string;
  notes?: string;
}) {
  const parsedAmount = Math.abs(Number(data.amount) || 0);
  const merchantName = (data.merchant || "Pago con Apple Pay").trim();
  const cardName = (data.card || "Apple Pay").trim();
  const txType = (data.type === "income" ? "income" : "expense") as "income" | "expense";

  if (parsedAmount <= 0) {
    return NextResponse.json(
      { success: false, error: "El monto debe ser mayor a $0.00" },
      { status: 400 }
    );
  }

  // 1. Obtener usuario (si no se proporciona userId, tomar el primer usuario registrado en public.users)
  let targetUserId = data.userId;

  if (!targetUserId) {
    const { data: users, error: userErr } = await (supabaseAdmin.from("users") as any)
      .select("id")
      .limit(1);

    if (userErr || !users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontró ningún usuario registrado en FacturaControl" },
        { status: 404 }
      );
    }
    targetUserId = (users as any[])[0].id;
  }

  // 2. Buscar o crear cartera coincidente para la tarjeta de Apple Pay
  const { data: wallets } = await (supabaseAdmin.from("wallets") as any)
    .select("*")
    .eq("user_id", targetUserId);

  let targetWalletId: string | null = null;

  if (wallets && wallets.length > 0) {
    // Intentar emparejar por nombre de banco / tarjeta (ej. "BBVA", "Nu", "Santander", "Apple Pay")
    const matched = wallets.find((w: any) =>
      cardName.toLowerCase().includes(w.name.toLowerCase()) ||
      w.name.toLowerCase().includes(cardName.toLowerCase())
    );

    targetWalletId = matched ? matched.id : wallets[0].id;
  } else {
    // Crear cartera predeterminada
    const { data: newWallet } = await (supabaseAdmin.from("wallets") as any)
      .insert({
        user_id: targetUserId,
        name: "Apple Pay (Cartera)",
        type: "debit",
        balance: 0.00,
        currency: "MXN"
      })
      .select()
      .single();

    targetWalletId = newWallet?.id;
  }

  if (!targetWalletId) {
    return NextResponse.json(
      { success: false, error: "No se pudo vincular una cartera para la transacción" },
      { status: 500 }
    );
  }

  // 3. Insertar la transacción de Apple Pay
  const { data: newTx, error: txError } = await (supabaseAdmin.from("transactions") as any)
    .insert({
      user_id: targetUserId,
      wallet_id: targetWalletId,
      type: txType,
      amount: parsedAmount,
      concept: `Apple Pay: ${merchantName}`,
      date: new Date().toISOString()
    })
    .select()
    .single();

  if (txError) {
    console.error("[Apple Pay Insert Error]:", txError);
    return NextResponse.json(
      { success: false, error: txError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `¡Pago con Apple Pay registrado correctamente! $${parsedAmount.toFixed(2)} en ${merchantName}`,
    transaction: newTx
  });
}
