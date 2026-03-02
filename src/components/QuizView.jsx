export function QuizView({
  currentWord,
  options,
  showResult,
  isCorrect,
  autoNextMs,
  optionsCount,
  vocabularyLength,
  optionsCounts,
  onAnswerSelect,
  onNext,
  onResetSet,
  onOptionsCountChange,
  onAutoNextChange,
  onFileChange,
  onExport,
  onClearProgress,
  speakWord,
  getWordProgress,
}) {
  const baseOption =
    'w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition focus:outline-none -webkit-tap-highlight-color-transparent'

  const optionClass = (opt) => {
    if (!showResult) {
      return (
        baseOption +
        ' border-slate-700 bg-slate-900 text-slate-50 hover:border-sky-400 hover:bg-slate-800'
      )
    }
    if (opt === currentWord.vi) {
      return baseOption + ' border-emerald-400 bg-emerald-900/40 text-emerald-100'
    }
    if (!isCorrect) {
      return baseOption + ' border-slate-700 bg-slate-900/60 text-slate-400 opacity-60'
    }
    return baseOption + ' border-slate-700 bg-slate-900/60 text-slate-400 opacity-60'
  }

  const progress = getWordProgress(currentWord.en)

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-slate-900 px-6 py-8 text-center shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-3xl font-bold tracking-tight">{currentWord.en}</span>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-xl border border-sky-400 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-50 transition hover:bg-slate-700"
            onClick={() => speakWord(currentWord.en, 'en-US', 2, 1000)}
          >
            🔊 Đọc lại
          </button>
        </div>
        {progress.priority > 0 && (
          <div className="mt-2 text-xs text-sky-300">
            Ưu tiên:{' '}
            <span className="rounded-md bg-sky-900/40 px-1.5 py-0.5 font-semibold">
              {progress.priority}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            className={optionClass(opt)}
            onClick={(e) => onAnswerSelect(opt, e)}
            disabled={showResult}
          >
            {opt}
          </button>
        ))}
      </div>

      {showResult && (
        <div
          className={
            'rounded-xl border px-4 py-3 text-sm ' +
            (isCorrect
              ? 'border-emerald-400 bg-emerald-900/40 text-emerald-100'
              : 'border-rose-400 bg-rose-900/30 text-rose-100')
          }
        >
          {isCorrect ? (
            <>✅ Đúng! Từ "{currentWord.en}" = {currentWord.vi}</>
          ) : (
            <>
              ❌ Sai! Đáp án đúng: <strong>{currentWord.en}</strong> = {currentWord.vi}
            </>
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          className="rounded-xl bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-300"
          onClick={onNext}
        >
          Từ tiếp theo →
        </button>
        {showResult && (
          <span className="text-xs text-slate-400">
            Tự động chuyển sau {(autoNextMs / 1000).toFixed(1)} giây
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 border-t border-slate-800 pt-4">
        <button
          type="button"
          className="toolbar-btn-secondary"
          onClick={onResetSet}
          title="Quay lại chọn bộ từ"
        >
          Đổi bộ từ
        </button>

        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-slate-400">Số đáp án:</span>
          {optionsCounts.map((n) => (
            <button
              key={n}
              type="button"
              className={
                'rounded-md px-2 py-1 text-xs font-medium ' +
                (optionsCount === n
                  ? 'bg-sky-400 text-slate-950'
                  : 'bg-slate-800 text-slate-100')
              }
              onClick={() => onOptionsCountChange(n)}
              disabled={vocabularyLength < n}
              title={vocabularyLength < n ? `Cần ≥ ${n} từ` : `${n} đáp án`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Tự next:</span>
          <select
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            value={autoNextMs}
            onChange={(e) => onAutoNextChange(Number(e.target.value))}
          >
            {[...Array(20)].map((_, i) => {
              const ms = (i + 1) * 200
              return (
                <option key={ms} value={ms}>
                  {(ms / 1000).toFixed(1)}s
                </option>
              )
            })}
          </select>
        </div>

        <label className="toolbar-btn-secondary cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={onFileChange}
            className="hidden"
          />
          Import JSON
        </label>

        <button type="button" className="toolbar-btn-secondary" onClick={onExport}>
          Xuất tiến độ JSON
        </button>

        <button
          type="button"
          className="rounded-md border border-rose-400/60 bg-transparent px-3 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10"
          onClick={onClearProgress}
          title="Xóa lịch sử sai/ưu tiên, giữ nguyên từ vựng"
        >
          Xóa tiến độ
        </button>
      </div>
    </div>
  )
}

