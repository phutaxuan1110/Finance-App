import type { Account, AppData, Category, MonthlyBudget, Transaction, UserSettings } from "@/types";
import { uid } from "./utils";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat_food", name: "Ăn uống", icon: "UtensilsCrossed", color: "#E5B96F", type: "expense", isDefault: true },
  { id: "cat_transport", name: "Di chuyển", icon: "Car", color: "#77A6C5", type: "expense", isDefault: true },
  { id: "cat_shopping", name: "Mua sắm", icon: "ShoppingBag", color: "#B76E79", type: "expense", isDefault: true },
  { id: "cat_bills", name: "Hóa đơn", icon: "Receipt", color: "#8F4F5A", type: "expense", isDefault: true },
  { id: "cat_entertainment", name: "Giải trí", icon: "Popcorn", color: "#9B7FD4", type: "expense", isDefault: true },
  { id: "cat_health", name: "Sức khỏe", icon: "HeartPulse", color: "#E87878", type: "expense", isDefault: true },
  { id: "cat_education", name: "Giáo dục", icon: "GraduationCap", color: "#6FB3E5", type: "expense", isDefault: true },
  { id: "cat_home", name: "Nhà cửa", icon: "Home", color: "#C9828D", type: "expense", isDefault: true },
  { id: "cat_coffee", name: "Cà phê", icon: "Coffee", color: "#B08968", type: "expense", isDefault: true },
  { id: "cat_travel", name: "Du lịch", icon: "Plane", color: "#5FBFA8", type: "expense", isDefault: true },
  { id: "cat_gift", name: "Quà tặng", icon: "Gift", color: "#D9A4AC", type: "expense", isDefault: true },
  { id: "cat_other_expense", name: "Khác", icon: "MoreHorizontal", color: "#A49DA0", type: "expense", isDefault: true },
  { id: "cat_salary", name: "Lương", icon: "Wallet", color: "#77C58A", type: "income", isDefault: true },
  { id: "cat_bonus", name: "Thưởng", icon: "Sparkles", color: "#77C58A", type: "income", isDefault: true },
  { id: "cat_freelance", name: "Freelance", icon: "Laptop", color: "#77C58A", type: "income", isDefault: true },
  { id: "cat_investment", name: "Đầu tư", icon: "TrendingUp", color: "#77C58A", type: "income", isDefault: true },
  { id: "cat_other_income", name: "Khác", icon: "MoreHorizontal", color: "#77C58A", type: "income", isDefault: true },
];

function daysAgoISO(days: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function buildDemoData(): AppData {
  const now = new Date().toISOString();

  const accounts: Account[] = [
    {
      id: "acc_vcb",
      name: "Vietcombank",
      institution: "Vietcombank",
      type: "bank",
      lastFourDigits: "4821",
      balance: 18_450_000,
      color: "#B76E79",
      isPrimary: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "acc_tcb",
      name: "Techcombank",
      institution: "Techcombank",
      type: "bank",
      lastFourDigits: "1190",
      balance: 6_200_000,
      color: "#8F4F5A",
      isPrimary: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "acc_cash",
      name: "Tiền mặt",
      institution: "Ví tiền mặt",
      type: "cash",
      balance: 850_000,
      color: "#77C58A",
      isPrimary: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "acc_save",
      name: "Tiết kiệm linh hoạt",
      institution: "Techcombank",
      type: "savings",
      lastFourDigits: "7702",
      balance: 32_000_000,
      color: "#5FBFA8",
      isPrimary: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const merchants: Record<string, string[]> = {
    cat_food: ["Cơm tấm Sài Gòn", "Highlands Food", "Bún bò Huế Cô Ba", "Quán ăn gia đình", "GrabFood"],
    cat_transport: ["Grab", "Xăng Petrolimex", "Gửi xe tháng", "Be"],
    cat_shopping: ["Shopee", "Uniqlo", "Điện Máy Xanh", "Lazada"],
    cat_bills: ["EVN Điện lực", "Viettel", "Internet FPT", "Tiền nước"],
    cat_entertainment: ["CGV Cinemas", "Netflix", "Spotify"],
    cat_health: ["Nhà thuốc Long Châu", "Phòng khám Đa khoa"],
    cat_education: ["Udemy", "Sách Fahasa"],
    cat_home: ["Vệ sinh nhà cửa", "Bách Hóa Xanh"],
    cat_coffee: ["The Coffee House", "Highlands Coffee", "Phúc Long"],
    cat_travel: ["Vietnam Airlines", "Traveloka"],
    cat_gift: ["Quà sinh nhật", "Lì xì"],
    cat_other_expense: ["Chi phí khác"],
  };

  const transactions: Transaction[] = [];

  // Salary income, 3 days ago
  transactions.push({
    id: uid("txn"),
    type: "income",
    amount: 22_000_000,
    accountId: "acc_vcb",
    categoryId: "cat_salary",
    merchant: "Công ty TNHH ABC",
    note: "Lương tháng",
    date: daysAgoISO(3, 9, 0),
    isRecurring: true,
    createdAt: now,
    updatedAt: now,
  });

  transactions.push({
    id: uid("txn"),
    type: "income",
    amount: 3_500_000,
    accountId: "acc_tcb",
    categoryId: "cat_freelance",
    merchant: "Dự án thiết kế",
    note: "Thanh toán freelance",
    date: daysAgoISO(10, 15, 30),
    isRecurring: false,
    createdAt: now,
    updatedAt: now,
  });

  // Spread expenses across the last ~26 days, skip a few days entirely
  const expenseCategoryIds = Object.keys(merchants);
  const accountIds = ["acc_vcb", "acc_vcb", "acc_tcb", "acc_cash"];
  let seed = 7;
  function nextRand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let day = 25; day >= 0; day--) {
    // Skip roughly 1 in 5 days entirely (no spending days)
    if (Math.floor(nextRand() * 5) === 0) continue;
    const txCountToday = 1 + Math.floor(nextRand() * 3);
    for (let t = 0; t < txCountToday; t++) {
      const catId = expenseCategoryIds[Math.floor(nextRand() * expenseCategoryIds.length)];
      const merchantList = merchants[catId];
      const merchant = merchantList[Math.floor(nextRand() * merchantList.length)];
      const accountId = accountIds[Math.floor(nextRand() * accountIds.length)];
      let amount = 30_000 + Math.floor(nextRand() * 400_000);
      if (catId === "cat_bills") amount = 250_000 + Math.floor(nextRand() * 900_000);
      if (catId === "cat_travel") amount = 1_200_000 + Math.floor(nextRand() * 2_500_000);
      if (catId === "cat_shopping") amount = 150_000 + Math.floor(nextRand() * 1_200_000);

      transactions.push({
        id: uid("txn"),
        type: "expense",
        amount,
        accountId,
        categoryId: catId,
        merchant,
        note: "",
        date: daysAgoISO(day, 8 + Math.floor(nextRand() * 12), Math.floor(nextRand() * 60)),
        isRecurring: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // One transfer from checking to savings
  transactions.push({
    id: uid("txn"),
    type: "transfer",
    amount: 5_000_000,
    accountId: "acc_vcb",
    destinationAccountId: "acc_save",
    merchant: "",
    note: "Chuyển tiết kiệm tháng",
    date: daysAgoISO(2, 10, 0),
    isRecurring: false,
    createdAt: now,
    updatedAt: now,
  });

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const today = new Date();
  const budgets: MonthlyBudget[] = [
    {
      id: uid("budget"),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      limit: 12_000_000,
      categoryLimits: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const settings: UserSettings = {
    name: "Minh Anh",
    currency: "VND",
    financialMonthStartDay: 1,
    defaultAccountId: "acc_vcb",
    theme: "dark",
    defaultMonthlyLimit: 12_000_000,
    onboardingCompleted: true,
  };

  return {
    accounts,
    transactions,
    categories: DEFAULT_CATEGORIES,
    budgets,
    settings,
    meta: { seededAt: now, lastRecentAccountId: "acc_vcb", lastRecentCategoryId: "cat_food" },
  };
}
