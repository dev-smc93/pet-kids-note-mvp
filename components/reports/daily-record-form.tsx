"use client";

import { useState } from "react";

export interface DailyRecordData {
  mood?: string;
  health?: string;
  temperatureCheck?: string;
  mealStatus?: string;
  sleepTime?: string;
  bowelStatus?: string;
}

const DAILY_RECORD_OPTIONS = {
  mood: [
    { value: "GOOD", label: "좋음" },
    { value: "NORMAL", label: "보통" },
    { value: "BAD", label: "나쁨" },
  ],
  health: [
    { value: "GOOD", label: "좋음" },
    { value: "NORMAL", label: "보통" },
    { value: "BAD", label: "나쁨" },
  ],
  temperatureCheck: [
    { value: "NORMAL", label: "정상" },
    { value: "LOW_FEVER", label: "미열" },
    { value: "HIGH_FEVER", label: "고열" },
  ],
  mealStatus: [
    { value: "NORMAL_AMOUNT", label: "정량" },
    { value: "A_LOT", label: "많이" },
    { value: "A_LITTLE", label: "적게" },
    { value: "NONE", label: "안했음" },
  ],
  sleepTime: [
    { value: "NONE", label: "잠을 안 잤음" },
    { value: "UNDER_1H", label: "1시간 미만" },
    { value: "1H_1H30", label: "1시간~1시간30분" },
    { value: "1H30_2H", label: "1시간30분~2시간" },
    { value: "OVER_2H", label: "2시간 이상" },
  ],
  bowelStatus: [
    { value: "NORMAL", label: "보통" },
    { value: "HARD", label: "딱딱함" },
    { value: "LOOSE", label: "묽음" },
    { value: "DIARRHEA", label: "설사" },
    { value: "NONE", label: "안했음" },
  ],
} as const;

const DAILY_RECORD_LABELS: Record<string, Record<string, string>> = {
  mood: Object.fromEntries(DAILY_RECORD_OPTIONS.mood.map((o) => [o.value, o.label])),
  health: Object.fromEntries(DAILY_RECORD_OPTIONS.health.map((o) => [o.value, o.label])),
  temperatureCheck: Object.fromEntries(DAILY_RECORD_OPTIONS.temperatureCheck.map((o) => [o.value, o.label])),
  mealStatus: Object.fromEntries(DAILY_RECORD_OPTIONS.mealStatus.map((o) => [o.value, o.label])),
  sleepTime: Object.fromEntries(DAILY_RECORD_OPTIONS.sleepTime.map((o) => [o.value, o.label])),
  bowelStatus: Object.fromEntries(DAILY_RECORD_OPTIONS.bowelStatus.map((o) => [o.value, o.label])),
};

export const DAILY_RECORD_TITLES: Record<string, string> = {
  mood: "기분",
  health: "건강",
  temperatureCheck: "체온체크",
  mealStatus: "식사여부",
  sleepTime: "수면시간",
  bowelStatus: "배변상태",
};

export function getDailyRecordLabel(field: string, value: string): string {
  return DAILY_RECORD_LABELS[field]?.[value] ?? value;
}

interface DailyRecordFormProps {
  value: DailyRecordData;
  onChange: (value: DailyRecordData) => void;
  /** 접힌 상태로 시작 (아코디언) */
  defaultCollapsed?: boolean;
}

export function DailyRecordForm({
  value,
  onChange,
  defaultCollapsed = true,
}: DailyRecordFormProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  const update = (key: keyof DailyRecordData, val: string | undefined) => {
    onChange({ ...value, [key]: val || undefined });
  };

  const OptionGroup = ({
    title,
    field,
    options,
  }: {
    title: string;
    field: keyof DailyRecordData;
    options: readonly { value: string; label: string }[];
  }) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value[field] === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => update(field, selected ? undefined : opt.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                selected
                  ? "bg-red-500 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {selected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-red-500 px-4 py-3 text-left text-white"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="font-semibold">생활기록</span>
          <span className="text-red-200">*</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="space-y-6 border-t border-zinc-100 p-4">
          <OptionGroup
            title="기분"
            field="mood"
            options={DAILY_RECORD_OPTIONS.mood}
          />
          <OptionGroup
            title="건강"
            field="health"
            options={DAILY_RECORD_OPTIONS.health}
          />
          <OptionGroup
            title="체온체크"
            field="temperatureCheck"
            options={DAILY_RECORD_OPTIONS.temperatureCheck}
          />
          <OptionGroup
            title="식사여부"
            field="mealStatus"
            options={DAILY_RECORD_OPTIONS.mealStatus}
          />
          <OptionGroup
            title="수면시간"
            field="sleepTime"
            options={DAILY_RECORD_OPTIONS.sleepTime}
          />
          <OptionGroup
            title="배변상태"
            field="bowelStatus"
            options={DAILY_RECORD_OPTIONS.bowelStatus}
          />
        </div>
      )}
    </div>
  );
}
