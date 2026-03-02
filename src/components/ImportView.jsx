export function ImportView({ fileInputRef, onFileChange, presets, presetLoading }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold text-slate-50">Chọn bộ từ có sẵn</h2>

      <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="flex flex-col items-start gap-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-left text-slate-50 transition hover:border-sky-400 hover:bg-slate-800/70 disabled:cursor-wait disabled:opacity-70"
            onClick={() => preset.onSelect?.(preset)}
            disabled={!!presetLoading}
          >
            <span className="text-sm font-semibold">{preset.name}</span>
            {preset.description && (
              <span className="text-xs text-slate-400">{preset.description}</span>
            )}
            {presetLoading === preset.id && (
              <span className="text-xs text-sky-400">Đang tải...</span>
            )}
          </button>
        ))}
      </div>

      <div className="my-3 flex w-full max-w-xs items-center gap-3">
        <div className="h-px flex-1 bg-slate-700" />
        <span className="text-xs text-slate-400">hoặc</span>
        <div className="h-px flex-1 bg-slate-700" />
      </div>

      <label className="inline-flex cursor-pointer items-center rounded-xl bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-300">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onFileChange}
          className="hidden"
        />
        Import file JSON
      </label>

      <p className="mt-1 text-xs text-slate-400">
        Định dạng:{' '}
        <code className="rounded bg-slate-900 px-1.5 py-0.5 text-[0.7rem]">
          {'{ "từ tiếng anh": "nghĩa tiếng việt" }'}
        </code>
      </p>
      <p className="text-xs text-slate-400">
        <a href="/sample-vocabulary.json" download className="text-sky-400 hover:underline">
          sample-vocabulary.json
        </a>{' '}
        ·{' '}
        <a href="/sample-progress.json" download className="text-sky-400 hover:underline">
          sample-progress.json
        </a>
      </p>
    </div>
  )
}

