"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

type Props = {
    page: number
    pageSize: number
    totalPages: number
    totalElements: number
    loading: boolean
    idPrefix: string
    onPrev: () => void
    onNext: () => void
    onPageSizeChange: (size: number) => void
    pageSizeOptions?: number[]
}

export function ReportPagination({
    page, pageSize, totalPages, totalElements, loading, idPrefix,
    onPrev, onNext, onPageSizeChange, pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: Props) {
    const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1
    const rangeEnd = Math.min(totalElements, (page + 1) * pageSize)

    return (
        <div className="shrink-0 px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">
                    {totalElements === 0 ? (
                        "No results"
                    ) : (
                        <>
                            Showing <span className="font-medium text-slate-700">{rangeStart}–{rangeEnd}</span> of{" "}
                            <span className="font-medium text-slate-700">{totalElements.toLocaleString()}</span>
                        </>
                    )}
                </p>
                <div className="flex items-center gap-1.5">
                    <label htmlFor={`${idPrefix}-page-size`} className="text-xs text-slate-400">Rows</label>
                    <select
                        id={`${idPrefix}-page-size`}
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="text-xs border border-slate-200 rounded-lg pl-2 pr-6 py-1 text-slate-600 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                        {pageSizeOptions.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onPrev}
                    disabled={page === 0 || loading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 disabled:border-slate-200 disabled:bg-white disabled:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-100 hover:border-blue-300 transition-all"
                >
                    <ChevronLeft size={15} />
                    Prev
                </button>
                <span className="text-xs text-slate-400 px-1">
                    {totalPages === 0 ? 0 : page + 1} / {totalPages}
                </span>
                <button
                    onClick={onNext}
                    disabled={page + 1 >= totalPages || loading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 disabled:border-slate-200 disabled:bg-white disabled:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-100 hover:border-blue-300 transition-all"
                >
                    Next
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
    )
}
