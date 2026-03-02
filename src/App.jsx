import { useState, useCallback, useRef, useEffect } from 'react'
import { ImportView } from './components/ImportView.jsx'
import { QuizView } from './components/QuizView.jsx'

const STORAGE_KEY = 'english-vocab-progress'
const OPTIONS_COUNT_KEY = 'english-options-count'
const OPTIONS_COUNTS = Array.from({ length: 9 }, (_, i) => i + 2)
const AUTO_NEXT_KEY = 'english-auto-next-ms'
const AUTO_NEXT_VALUES = Array.from({ length: 20 }, (_, i) => (i + 1) * 200)

function speakWord(word, times = 2, delayMs = 1000) {
  if (!word || typeof speechSynthesis === 'undefined') return
  speechSynthesis.cancel()
  const speak = (remaining) => {
    if (remaining <= 0) return
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.onend = () => {
      if (remaining > 1) {
        setTimeout(() => speak(remaining - 1), delayMs)
      }
    }
    speechSynthesis.speak(utterance)
  }
  speak(times)
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.vocabulary?.length >= 2) return data
    return null
  } catch {
    return null
  }
}

function loadOptionsCount() {
  const v = localStorage.getItem(OPTIONS_COUNT_KEY)
  const n = parseInt(v, 10)
  return OPTIONS_COUNTS.includes(n) ? n : 4
}

function loadAutoNextMs() {
  const v = localStorage.getItem(AUTO_NEXT_KEY)
  const n = parseInt(v, 10)
  if (!Number.isFinite(n)) return 2000
  if (n < 200) return 200
  if (n > 4000) return 4000
  return n
}

function saveToStorage(vocabulary, progress) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ vocabulary, progress, savedAt: new Date().toISOString() })
    )
  } catch (e) {
    console.error('Lưu thất bại:', e)
  }
}

function App() {
  const [vocabulary, setVocabulary] = useState([])
  const [progress, setProgress] = useState({})
  const [vocabPresets, setVocabPresets] = useState([])
  const [presetLoading, setPresetLoading] = useState(null)
  const [optionsCount, setOptionsCount] = useState(loadOptionsCount())
  const [autoNextMs, setAutoNextMs] = useState(loadAutoNextMs)
  const [currentWord, setCurrentWord] = useState(null)
  const [options, setOptions] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const autoNextTimerRef = useRef(null)
  const fileInputRef = useRef(null)

  const clearActiveElement = () => {
    if (typeof document === 'undefined') return
    const active = document.activeElement
    if (active && active instanceof HTMLElement) {
      active.blur()
    }
  }

  const getWordProgress = (en) =>
    progress[en] ?? { wrongCount: 0, priority: 0, shownCount: 0 }

  const normalizeVocab = (data) => {
    const entries = Object.entries(data).map(([en, vi]) => ({ en, vi }))
    return entries
  }

  const isFullProgressFile = (data) =>
    Array.isArray(data?.vocabulary) && typeof data?.progress === 'object'

  const loadVocabData = useCallback((data) => {
    if (isFullProgressFile(data)) {
      setVocabulary(data.vocabulary)
      setProgress(data.progress ?? {})
    } else {
      const normalized = normalizeVocab(data)
      if (normalized.length < 2) {
        alert('Cần ít nhất 2 từ vựng!')
        return false
      }
      const stored = loadFromStorage()
      let mergedProgress = {}
      if (stored?.progress && stored.vocabulary?.length > 0) {
        const storedMap = new Map(stored.vocabulary.map((v) => [v.en, v.vi]))
        for (const { en } of normalized) {
          if (storedMap.has(en) && stored.progress[en]) {
            mergedProgress[en] = stored.progress[en]
          }
        }
      }
      setVocabulary(normalized)
      setProgress(mergedProgress)
    }
    setCurrentWord(null)
    setSelectedAnswer(null)
    setShowResult(false)
    return true
  }, [])

  const handlePresetSelect = async (preset) => {
    setPresetLoading(preset.id)
    try {
      const res = await fetch(`/vocab/${preset.file}`)
      if (!res.ok) throw new Error('Không tải được')
      const data = await res.json()
      loadVocabData(data)
    } catch (err) {
      alert('Không tải được bộ từ. Thử lại sau.')
    } finally {
      setPresetLoading(null)
    }
  }

  const handleFileImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        loadVocabData(data)
      } catch (err) {
        alert('File JSON không hợp lệ!')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const getWeightedRandomWord = useCallback(() => {
    if (vocabulary.length === 0) return null

    const neverShown = vocabulary.filter((item) => {
      const p = progress[item.en]
      const shown = p?.shownCount ?? (p ? 1 : 0)
      return shown === 0
    })

    if (neverShown.length > 0) {
      return neverShown[Math.floor(Math.random() * neverShown.length)]
    }

    const weights = vocabulary.map((item) => {
      const { priority } = getWordProgress(item.en)
      return priority + 1
    })
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let random = Math.random() * totalWeight

    for (let i = 0; i < vocabulary.length; i++) {
      random -= weights[i]
      if (random <= 0) return vocabulary[i]
    }
    return vocabulary[vocabulary.length - 1]
  }, [vocabulary, progress])

  const generateOptions = useCallback(
    (correctItem) => {
      const others = vocabulary.filter((v) => v.en !== correctItem.en)
      const shuffled = [...others].sort(() => Math.random() - 0.5)
      const wrongCount = optionsCount - 1
      const wrongOptions = shuffled.slice(0, wrongCount).map((v) => v.vi)

      const allOptions = [correctItem.vi, ...wrongOptions]
      return allOptions.sort(() => Math.random() - 0.5)
    },
    [vocabulary, optionsCount]
  )

  const pickNextWord = useCallback(() => {
    if (vocabulary.length < optionsCount) return

    clearActiveElement()

    const word = getWeightedRandomWord()
    if (!word) return

    setProgress((prev) => {
      const curr = prev[word.en] ?? { wrongCount: 0, priority: 0, shownCount: 0 }
      return {
        ...prev,
        [word.en]: { ...curr, shownCount: (curr.shownCount ?? 0) + 1 },
      }
    })
    const opts = generateOptions(word)
    setCurrentWord(word)
    setOptions(opts)
    setSelectedAnswer(null)
    setShowResult(false)
  }, [vocabulary, optionsCount, getWeightedRandomWord, generateOptions])

  const handleAnswerSelect = (answer, event) => {
    if (showResult) return

    const correct = answer === currentWord.vi
    setSelectedAnswer(answer)
    setIsCorrect(correct)
    setShowResult(true)

    if (event?.currentTarget && typeof event.currentTarget.blur === 'function') {
      event.currentTarget.blur()
    }

    setProgress((prev) => {
      const curr = prev[currentWord.en] ?? {
        wrongCount: 0,
        priority: 0,
        shownCount: 1,
      }
      let next
      if (correct) {
        next = {
          ...curr,
          wrongCount: curr.wrongCount,
          priority: Math.max(0, curr.priority - 1),
        }
      } else {
        next = {
          ...curr,
          wrongCount: curr.wrongCount + 1,
          priority: curr.priority + 1,
        }
      }
      return { ...prev, [currentWord.en]: next }
    })

    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current)
    const delay = correct ? autoNextMs : autoNextMs * 3
    autoNextTimerRef.current = setTimeout(pickNextWord, delay)
  }

  const handleNext = () => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current)
      autoNextTimerRef.current = null
    }
    pickNextWord()
  }

  const handleExport = () => {
    const data = {
      vocabulary,
      progress,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `english-progress-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClearProgress = () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ tiến độ? Từ vựng vẫn giữ nguyên.')) return
    setProgress({})
    saveToStorage(vocabulary, {})
  }

  useEffect(() => {
    const stored = loadFromStorage()
    let count = loadOptionsCount()
    if (stored && stored.vocabulary.length < count) {
      const valid = OPTIONS_COUNTS.filter((n) => n <= stored.vocabulary.length)
      count = valid.length ? Math.max(...valid) : 2
      localStorage.setItem(OPTIONS_COUNT_KEY, String(count))
    }
    if (stored) {
      setVocabulary(stored.vocabulary)
      setProgress(stored.progress ?? {})
    }
    setOptionsCount(count)
  }, [])

  useEffect(() => {
    if (vocabulary.length > 0) return
    fetch('/vocab/list.json')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setVocabPresets(data?.sets ?? []))
      .catch(() => setVocabPresets([]))
  }, [vocabulary.length])

  useEffect(() => {
    if (vocabulary.length >= optionsCount && !currentWord) pickNextWord()
  }, [vocabulary, optionsCount, currentWord, pickNextWord])

  useEffect(() => {
    if (vocabulary.length >= 2) {
      saveToStorage(vocabulary, progress)
    }
  }, [vocabulary, progress])

  const handleOptionsCountChange = (n) => {
    if (vocabulary.length >= n) {
      setOptionsCount(n)
      localStorage.setItem(OPTIONS_COUNT_KEY, String(n))
      setCurrentWord(null)
    } else {
      alert(`Cần ít nhất ${n} từ vựng để chọn ${n} đáp án. Hiện có ${vocabulary.length} từ.`)
    }
  }

  useEffect(() => {
    localStorage.setItem(AUTO_NEXT_KEY, String(autoNextMs))
  }, [autoNextMs])

  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current)
      speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    if (!currentWord) return
    speechSynthesis?.cancel()
    speakWord(currentWord.en, 2, 1000)
  }, [currentWord?.en])

  const optionClass = (opt) => {
    if (!showResult) return ''
    if (opt === currentWord.vi) return 'correct'
    if (opt === selectedAnswer && !isCorrect) return 'wrong'
    return 'disabled'
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">📚 Học từ vựng tiếng Anh</h1>
      </header>

      {vocabulary.length === 0 ? (
        <ImportView
          fileInputRef={fileInputRef}
          onFileChange={handleFileImport}
          presets={vocabPresets.map((preset) => ({
            ...preset,
            onSelect: handlePresetSelect,
          }))}
          presetLoading={presetLoading}
        />
      ) : (
        currentWord && (
          <QuizView
            currentWord={currentWord}
            options={options}
            showResult={showResult}
            isCorrect={isCorrect}
            autoNextMs={autoNextMs}
            optionsCount={optionsCount}
            vocabularyLength={vocabulary.length}
            optionsCounts={OPTIONS_COUNTS}
            onAnswerSelect={handleAnswerSelect}
            onNext={handleNext}
            onResetSet={() => {
              setVocabulary([])
              setCurrentWord(null)
            }}
            onOptionsCountChange={handleOptionsCountChange}
            onAutoNextChange={setAutoNextMs}
            onFileChange={handleFileImport}
            onExport={handleExport}
            onClearProgress={handleClearProgress}
            speakWord={speakWord}
            getWordProgress={getWordProgress}
          />
        )
      )}
    </div>
  )
}

export default App
