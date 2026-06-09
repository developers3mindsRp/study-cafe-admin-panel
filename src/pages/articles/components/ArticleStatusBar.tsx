import { useEffect, useState } from "react";
import { api } from "../../../api/axios";

interface StatusCounts {
  all: number;
  published: number;
  draft: number;
  scheduled: number;
  pending: number;
  trash: number;
}

interface Props {
  activeStatus: string;
  onSelect: (status: string) => void;
  refreshKey?: number;
}

export function ArticleStatusBar({ activeStatus, onSelect, refreshKey }: Props) {
  const [counts, setCounts] = useState<StatusCounts | null>(null);

  useEffect(() => {
    api
      .get<StatusCounts>("/admin/platform/articles/counts")
      .then((r) => setCounts(r.data))
      .catch(() => {});
  }, [refreshKey]);

  if (!counts) return null;

  const tabs = [
    { label: "All", value: "", count: counts.all },
    { label: "Published", value: "publish", count: counts.published },
    { label: "Drafts", value: "draft", count: counts.draft },
    { label: "Scheduled", value: "scheduled", count: counts.scheduled },
    ...(counts.pending > 0 ? [{ label: "Pending", value: "pending", count: counts.pending }] : []),
    { label: "Trash", value: "trash", count: counts.trash },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
      {tabs.map((tab, i) => {
        const isActive = activeStatus === tab.value;
        return (
          <span key={tab.value} className="flex items-center gap-x-1">
            {i > 0 && <span className="select-none text-gray-300 dark:text-gray-600">|</span>}
            <button
              type="button"
              onClick={() => onSelect(tab.value)}
              className={`rounded px-1 py-0.5 transition-colors hover:text-gray-900 dark:hover:text-white ${
                isActive
                  ? "font-semibold text-brand-600 dark:text-brand-400"
                  : "hover:underline"
              }`}
            >
              {tab.label}{" "}
              <span className={isActive ? "text-brand-500" : "text-gray-400 dark:text-gray-500"}>
                ({tab.count.toLocaleString()})
              </span>
            </button>
          </span>
        );
      })}
    </div>
  );
}
