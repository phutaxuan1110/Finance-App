"use client";

import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/Input";
import type { Account, Category } from "@/types";

export interface TransactionFilterState {
  search: string;
  accountId: string;
  categoryId: string;
  type: string;
  dateFrom: string;
  dateTo: string;
}

export function TransactionFilters({
  filters,
  onChange,
  accounts,
  categories,
}: {
  filters: TransactionFilterState;
  onChange: (patch: Partial<TransactionFilterState>) => void;
  accounts: Account[];
  categories: Category[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <Input
          className="pl-10"
          placeholder="Tìm theo ghi chú hoặc người nhận"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          aria-label="Tìm kiếm giao dịch"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Select
          value={filters.type}
          onChange={(e) => onChange({ type: e.target.value })}
          className="!w-auto shrink-0 min-w-[110px] !h-10 text-xs"
        >
          <option value="">Tất cả loại</option>
          <option value="expense">Chi</option>
          <option value="income">Thu</option>
          <option value="transfer">Chuyển tiền</option>
        </Select>

        <Select
          value={filters.accountId}
          onChange={(e) => onChange({ accountId: e.target.value })}
          className="!w-auto shrink-0 min-w-[130px] !h-10 text-xs"
        >
          <option value="">Tất cả tài khoản</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          className="!w-auto shrink-0 min-w-[130px] !h-10 text-xs"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => onChange({ dateFrom: e.target.value })}
          className="!w-auto shrink-0 !h-10 text-xs"
          aria-label="Từ ngày"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => onChange({ dateTo: e.target.value })}
          className="!w-auto shrink-0 !h-10 text-xs"
          aria-label="Đến ngày"
        />
      </div>
    </div>
  );
}
