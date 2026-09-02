"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { CURRENCIES } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { SnakeMascot } from "@/components/mascot/SnakeMascot";
import { cn, formatVNDInput, parseVNDInput } from "@/lib/utils";
import type { DisplayCurrency } from "@/types";

export function OnboardingProfileFlow() {
  const { data, saveSettings } = useData();
  const [screen, setScreen] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [limitDisplay, setLimitDisplay] = useState("");
  const [currency, setCurrency] = useState<DisplayCurrency>(data?.settings.currency ?? "VND");
  const [saving, setSaving] = useState(false);

  if (!data) return null;

  const nameValid = name.trim().length > 0;
  const limitValid = parseVNDInput(limitDisplay) > 0;

  async function handleContinue() {
    if (!nameValid || saving) return;
    setSaving(true);
    try {
      // Persist the name right away so it survives the user closing the
      // app between Screen 1 and Screen 2 — resumability relies on this.
      await saveSettings({ ...data!.settings, name: name.trim() });
      setScreen(2);
    } finally {
      setSaving(false);
    }
  }

  async function handleStart() {
    if (!limitValid || saving) return;
    setSaving(true);
    try {
      // onboardingCompleted stays false here on purpose: the guided
      // walkthrough for the first transaction still has to run before
      // onboarding is actually considered done.
      await saveSettings({
        ...data!.settings,
        name: name.trim(),
        defaultMonthlyLimit: parseVNDInput(limitDisplay),
        currency,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
        <SnakeMascot expression="happy" size={72} />

        {screen === 1 ? (
          <>
            <div>
              <h1 className="text-2xl font-semibold mb-2">Chào bạn 👋</h1>
              <p className="text-sm text-text-muted">Hãy cho chúng tôi biết nên gọi bạn là gì.</p>
            </div>
            <div className="w-full text-left">
              <Label htmlFor="onboarding-name">Tên của bạn</Label>
              <Input
                id="onboarding-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên"
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              />
            </div>
            <Button className="w-full" disabled={!nameValid || saving} onClick={handleContinue}>
              Tiếp tục
            </Button>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold mb-2">Đặt giới hạn chi tiêu</h1>
              <p className="text-sm text-text-muted">Thiết lập ngân sách để dễ theo dõi chi tiêu mỗi tháng.</p>
            </div>
            <div className="w-full text-left">
              <Label htmlFor="onboarding-limit">Giới hạn chi tiêu hàng tháng</Label>
              <div className="relative">
                <Input
                  id="onboarding-limit"
                  autoFocus
                  inputMode="numeric"
                  value={limitDisplay}
                  onChange={(e) => setLimitDisplay(formatVNDInput(parseVNDInput(e.target.value)))}
                  placeholder="10.000.000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">đ</span>
              </div>
            </div>
            <div className="w-full text-left">
              <Label>Đơn vị tiền tệ</Label>
              <div className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.08] p-1 w-fit">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px]",
                      currency === c.code ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" disabled={!limitValid || saving} onClick={handleStart}>
              Bắt đầu
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
