"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SnakeMascot } from "@/components/mascot/SnakeMascot";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";

export default function LoginPage() {
  const { signIn, isCloudEnabled } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    router.replace("/tong-quan");
  }

  return (
    <div className="min-h-dvh app-shell-bg flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <SnakeMascot expression="happy" size={72} />
          <h1 className="text-xl font-semibold mt-3">{APP_NAME}</h1>
          <p className="text-sm text-text-muted">{APP_TAGLINE}</p>
        </div>

        {!isCloudEnabled && (
          <div className="rounded-2xl bg-warning/10 border border-warning/20 px-4 py-3 mb-5 text-xs text-warning">
            Đăng nhập chưa được cấu hình (thiếu biến môi trường Supabase). Ứng dụng vẫn dùng được với dữ liệu lưu trên
            thiết bị này.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@vidu.com"
            />
          </div>
          <div>
            <Label htmlFor="login-password">Mật khẩu</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" disabled={loading || !isCloudEnabled}>
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </form>

        <p className="text-sm text-text-muted text-center mt-6">
          Chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="text-accent-soft font-medium hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
