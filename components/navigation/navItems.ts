import { LayoutGrid, PieChart, Receipt, Wallet, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/tong-quan", label: "Tổng quan", icon: LayoutGrid },
  { href: "/phan-tich", label: "Phân tích", icon: PieChart },
  { href: "/giao-dich", label: "Giao dịch", icon: Receipt },
  { href: "/tai-khoan", label: "Tài khoản", icon: Wallet },
  { href: "/ca-nhan", label: "Cá nhân", icon: User },
] as const;
