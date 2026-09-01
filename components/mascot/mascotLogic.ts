import type { MascotExpression, Transaction } from "@/types";
import type { BudgetStatus } from "@/lib/calculations";
import { isSameDay } from "date-fns";

export interface MascotState {
  expression: MascotExpression;
  message: string;
}

export function mascotForBudget(
  status: BudgetStatus,
  transactions: Transaction[],
  monthEnded: boolean,
  referenceDate: Date = new Date()
): MascotState {
  const today = referenceDate;
  const spentToday = transactions.some(
    (t) => t.type === "expense" && isSameDay(new Date(t.date), today)
  );

  const lastTransactionDate = transactions
    .map((t) => new Date(t.date))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const daysSinceLastActivity = lastTransactionDate
    ? Math.floor((today.getTime() - lastTransactionDate.getTime()) / 86_400_000)
    : Infinity;

  if (daysSinceLastActivity >= 5) {
    return {
      expression: "sleeping",
      message: "Lâu rồi mình chưa thấy giao dịch nào. Thêm một khoản chi tiêu nhé!",
    };
  }

  if (monthEnded && status.percentUsed <= 100) {
    return { expression: "proud", message: "Tuyệt lắm! Tháng này vẫn còn dư." };
  }

  if (status.statusLevel === "over") {
    return { expression: "shocked", message: "Tháng này mình đã vượt ngân sách." };
  }

  if (status.statusLevel === "at") {
    return { expression: "shocked", message: "Bạn đã dùng hết ngân sách tháng này rồi." };
  }

  if (status.statusLevel === "near") {
    return { expression: "worried", message: "Chậm lại một chút nhé, sắp chạm giới hạn rồi." };
  }

  if (status.statusLevel === "steady") {
    return { expression: "focused", message: "Bạn vẫn đang kiểm soát tốt." };
  }

  if (!spentToday) {
    return { expression: "happy", message: "Hôm nay mình chưa tiêu gì đó!" };
  }

  return { expression: "happy", message: "Đang kiểm soát tốt, cứ thế nhé!" };
}
