"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function RealtimeSyncListener() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let channel: any = null;

    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;

      // Canal reactivo de Supabase Realtime
      channel = supabase
        .channel(`user-realtime-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
          () => {
            router.refresh();
            window.dispatchEvent(new Event("financial_data_synced"));
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
          () => {
            router.refresh();
            window.dispatchEvent(new Event("financial_data_synced"));
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "categories", filter: `user_id=eq.${userId}` },
          () => {
            router.refresh();
            window.dispatchEvent(new Event("financial_data_synced"));
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "recurring_payments", filter: `user_id=eq.${userId}` },
          () => {
            router.refresh();
            window.dispatchEvent(new Event("financial_data_synced"));
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "loans", filter: `user_id=eq.${userId}` },
          () => {
            router.refresh();
            window.dispatchEvent(new Event("financial_data_synced"));
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "savings_goals", filter: `user_id=eq.${userId}` },
          () => {
            router.refresh();
            window.dispatchEvent(new Event("financial_data_synced"));
          }
        )
        .subscribe();
    };

    setupSubscription();

    // Sincronización instantánea al cambiar de pestaña / regresar a la app en móvil
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        window.dispatchEvent(new Event("financial_data_synced"));
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [router, supabase]);

  return null;
}
