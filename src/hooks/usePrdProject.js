/**
 * State machine PRD Builder. Satu objek project mengalir lewat tahap:
 * idea → clarify → tech → structure → prd. Setiap panggilan AI memakai
 * konteks kumulatif (lihat lib/prd-api.js).
 *
 * Persistensi: auto-save debounced ke localStorage (pola useChatStore).
 * Navigasi keluar halaman saat generasi berjalan diberi guard beforeunload.
 *
 * Auth: panggilan AI butuh session. Jika belum login, error AuthError
 * ditangkap di sini dan diterjemahkan ke flag `needLogin` — caller UI
 * menampilkan LoginDialog existing, bukan throw ke pengguna.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  generateClarificationQuestions,
  generatePRD,
  generateProductStructure,
  generateProjectAnalysis,
  recommendTechnology,
  regeneratePRDSection,
} from '../lib/prd-api'
import { AuthError, isAuthenticated } from '../lib/auth'
import { newId } from '../state/ids.js'
import {
  PRD_STEPS,
  SECTION_STATUS,
  collectQAPairs,
  createEmptyProject,
  deriveProjectName,
  emptyTechStack,
  normalizeAnalysis,
  normalizeQuestions,
  normalizeSections,
  normalizeStructure,
  normalizeTechStack,
  validateIdea,
} from '../state/prd-model.js'
import {
  clearPrdState,
  loadPrdState,
  loadProject,
  removeProject as removeProjectLocal,
  savePrdState,
} from '../state/prd-persistence.js'
import { deletePrdProject, fetchPrdProject, fetchPrdProjects, savePrdProject } from '../lib/sync.js'

const LOADING_MESSAGES = {
  analyze: ['Menganalisis ide…', 'Memahami jenis produk…', 'Mencari requirement yang sudah jelas…'],
  questions: ['Menentukan konteks produk…', 'Mencari requirement yang masih belum jelas…', 'Membuat pertanyaan…'],
  tech: ['Menyesuaikan teknologi dengan kebutuhan…', 'Merekomendasikan stack…'],
  structure: ['Menyusun product structure…', 'Membagi fitur dan sub-fitur…'],
  prd: ['Menulis PRD…', 'Menyusun requirement terukur…', 'Merangkai acceptance criteria…'],
  regenerate: ['Menulis ulang section…', 'Menyesuaikan dengan instruksi…'],
}

function indexOfStep(step) {
  const i = PRD_STEPS.indexOf(step)
  return i === -1 ? 0 : i
}

export function usePrdProject({ projectParam } = {}) {
  // Project aktif: dari deep-link, atau baru saat membuka /prd-builder.
  const [project, setProject] = useState(() => {
    if (projectParam) {
      const stored = loadProject(projectParam)
      if (stored) return stored
    }
    return null
  })
  const [loadingStage, setLoadingStage] = useState(null)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState(null)
  const [needLogin, setNeedLogin] = useState(false)
  const [persistError, setPersistError] = useState(null)

  const dirtyRef = useRef(false)
  const loadingTimerRef = useRef(null)
  // Selalu baca project terbaru lewat ref — action bisa dipanggil berurutan
  // (mis. mulai → analisis → pertanyaan) tanpa terjebak closure state lama.
  const projectRef = useRef(project)
  useEffect(() => {
    projectRef.current = project
  }, [project])

  // Riwayat PRD per akun (metadata untuk dialog). Server = sumber kebenaran
  // saat login; project lokal yang belum tersinkron ikut ter-upload sekali.
  const [history, setHistory] = useState([])
  const [loadingProject, setLoadingProject] = useState(!!projectParam)
  const hydrated = useRef(false)
  const lastSynced = useRef(new Map())

  const step = project?.step || 'idea'
  const stepIndex = indexOfStep(step)
  const isWorking = !!loadingStage

  // ---------- persistence ------------------------------------------------

  const persist = useCallback((p) => {
    if (!p) return
    const state = loadPrdState()
    state.projects[p.id] = p
    state.activeId = p.id
    const err = savePrdState(state)
    setPersistError(err || null)
  }, [])

  // Auto-save (debounce) setiap project berubah.
  useEffect(() => {
    if (!project) return
    dirtyRef.current = true
    const t = setTimeout(() => {
      persist(project)
      dirtyRef.current = false
    }, 400)
    return () => clearTimeout(t)
  }, [project, persist])

  // Riwayat per akun: saat login, tarik list server, lalu upload project lokal
  // yang belum ada di server (mis. dibuat sebelum fitur ini) sekali jalan.
  const hydrate = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoadingProject(false)
      return
    }
    if (hydrated.current) return
    hydrated.current = true
    try {
      const list = await fetchPrdProjects()
      const metas = Array.isArray(list) ? list : []
      for (const m of metas) lastSynced.current.set(m.id, `${m.id}:${m.updatedAt || m.createdAt || 0}`)
      // Project lokal yang belum ada di server (dibuat sebelum login / sebelum
      // fitur ini) → upload sekali lalu gabungkan ke riwayat.
      const { projects } = loadPrdState()
      const localOnly = Object.values(projects).filter((p) => p?.id && p?.projectIdea && !lastSynced.current.has(p.id))
      for (const p of localOnly) {
        savePrdProject(p).catch(() => {})
      }
      setHistory(mergeMetas(metas, localOnly.map(toMeta)))
    } catch {
      // jaringan gagal → riwayat tetap dari lokal
      const { projects } = loadPrdState()
      setHistory(Object.values(projects).map(toMeta).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)))
    }
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Deep-link: bila ada :id yang belum ada di lokal, ambil dari server (akun).
  useEffect(() => {
    if (!projectParam) return
    if (loadProject(projectParam)) {
      setLoadingProject(false)
      return
    }
    if (!isAuthenticated()) {
      setLoadingProject(false)
      return
    }
    let cancelled = false
    fetchPrdProject(projectParam)
      .then((p) => {
        if (cancelled || !p?.id) return
        setProject(p)
        const { projects } = loadPrdState()
        projects[p.id] = p
        savePrdState({ v: 1, projects, activeId: p.id })
      })
      .finally(() => {
        if (!cancelled) setLoadingProject(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectParam])

  // Sinkron ke akun: project aktif yang berubah updatedAt di-PUT ke server
  // (debounce + sig per-id supaya tidak upload ulang). Hanya saat login &
  // riwayat sudah terhidrasi (server = sumber kebenaran).
  useEffect(() => {
    if (!project || !isAuthenticated()) return
    if (!hydrated.current) return
    const sig = `${project.id}:${project.updatedAt || 0}`
    if (lastSynced.current.get(project.id) === sig) return
    const t = setTimeout(() => {
      lastSynced.current.set(project.id, sig)
      savePrdProject(project)
        .then(() => {
          setHistory((h) => upsertMeta(h, project))
        })
        .catch(() => {
          if (lastSynced.current.get(project.id) === sig) lastSynced.current.delete(project.id)
        })
    }, 600)
    return () => clearTimeout(t)
  }, [project])

  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated()) {
      const { projects } = loadPrdState()
      setHistory(Object.values(projects).map(toMeta).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)))
      return
    }
    try {
      const list = await fetchPrdProjects()
      setHistory(Array.isArray(list) ? list : [])
    } catch {
      // biarkan riwayat sebelumnya
    }
  }, [])

  const deleteProjectFromHistory = useCallback(
    (id) => {
      removeProjectLocal(id)
      setHistory((h) => h.filter((m) => m.id !== id))
      if (projectRef.current?.id === id) setProject(null)
      if (isAuthenticated()) {
        deletePrdProject(id).catch(() => {})
      }
    },
    [],
  )
  // Guard: jangan biarkan pengguna kabur saat generasi masih jalan.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isWorking || dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isWorking])

  // ---------- loading message cycling ------------------------------------

  useEffect(() => {
    if (!loadingStage) {
      clearInterval(loadingTimerRef.current)
      return
    }
    const msgs = LOADING_MESSAGES[loadingStage] || LOADING_MESSAGES.analyze
    let i = 0
    setLoadingMessage(msgs[0])
    loadingTimerRef.current = setInterval(() => {
      i = (i + 1) % msgs.length
      setLoadingMessage(msgs[i])
    }, 2200)
    return () => clearInterval(loadingTimerRef.current)
  }, [loadingStage])

  // ---------- mutasi lokal ------------------------------------------------

  const updateProject = useCallback(
    (patch) => {
      setProject((p) => (p ? { ...p, ...patch, updatedAt: Date.now() } : p))
    },
    [],
  )

  const setAnswer = useCallback((questionId, value) => {
    setProject((p) => {
      if (!p) return p
      return { ...p, answers: { ...p.answers, [questionId]: value }, updatedAt: Date.now() }
    })
  }, [])

  const setStructure = useCallback((features) => {
    setProject((p) => (p ? { ...p, productStructure: { features }, updatedAt: Date.now() } : p))
  }, [])

  const setPRDSections = useCallback((sections) => {
    setProject((p) => (p ? { ...p, prd: { sections }, updatedAt: Date.now() } : p))
  }, [])

  // Cek auth sebelum panggil AI; jika tidak ada session, UI yang menangani
  // (LoginDialog muncul, hook set flag needLogin).
  const ensureAuth = useCallback(() => {
    if (isAuthenticated()) return true
    setNeedLogin(true)
    return false
  }, [])

  const runStage = useCallback(
    async (stage, fn, { onDone } = {}) => {
      setError(null)
      if (!ensureAuth()) throw new AuthError('Login diperlukan')
      setLoadingStage(stage)
      try {
        const out = await fn()
        onDone?.(out)
        return out
      } catch (e) {
        if (e instanceof AuthError) setNeedLogin(true)
        setError(e.message || 'Terjadi kesalahan')
        throw e
      } finally {
        setLoadingStage(null)
      }
    },
    [ensureAuth],
  )

  const runQuestions = useCallback(
    () =>
      runStage('questions', async () => {
        const p = projectRef.current
        if (!p) throw new Error('Project belum dimulai')
        const data = await generateClarificationQuestions(p)
        const questions = normalizeQuestions(data.questions)
        setProject((cur) =>
          cur ? { ...cur, questions, step: questions.length ? 'clarify' : 'tech', updatedAt: Date.now() } : cur,
        )
        return questions
      }),
    [runStage],
  )

  const runTech = useCallback(
    (mode) =>
      runStage('tech', async () => {
        const p = projectRef.current
        if (!p) throw new Error('Project belum dimulai')
        if (mode === 'manual') {
          updateProject({ technologySelectionMode: 'manual' })
          return emptyTechStack()
        }
        const data = await recommendTechnology(p)
        const stack = normalizeTechStack(data)
        updateProject({ technologySelectionMode: 'auto', technologyStack: stack })
        return stack
      }),
    [runStage, updateProject],
  )

  const runStructure = useCallback(
    () =>
      runStage('structure', async () => {
        const p = projectRef.current
        if (!p) throw new Error('Project belum dimulai')
        const data = await generateProductStructure(p)
        const structure = normalizeStructure(data)
        updateProject({ productStructure: structure })
        return structure
      }),
    [runStage, updateProject],
  )

  const runPRD = useCallback(
    () =>
      runStage('prd', async () => {
        const p = projectRef.current
        if (!p) throw new Error('Project belum dimulai')
        const data = await generatePRD(p)
        const sections = normalizeSections(data.sections)
        updateProject({ prd: { sections }, step: 'prd' })
        return sections
      }),
    [runStage, updateProject],
  )

  const runRegenerateSection = useCallback(
    ({ sectionTitle, sectionContent, instruction }) =>
      runStage('regenerate', async () => {
        const p = projectRef.current
        if (!p) throw new Error('Project belum dimulai')
        const data = await regeneratePRDSection(p, { sectionTitle, sectionContent, instruction })
        const sec = normalizeSectionClient(data)
        if (!sec) throw new Error('Section gagal diregenerate. Coba lagi.')
        setProject((cur) => {
          if (!cur) return cur
          const sections = cur.prd.sections.map((s) => (s.title === sectionTitle ? { ...sec, id: s.id } : s))
          return { ...cur, prd: { sections }, updatedAt: Date.now() }
        })
        return sec
      }),
    [runStage],
  )

  // Satu pintu masuk dari halaman: buat project → analisis → pertanyaan.
  // Berurutan memakai projectRef, jadi tidak ada race dengan render.
  const startFromIdea = useCallback(
    async ({ idea, language = 'id', model }) => {
      const id = projectRef.current?.id || newId('prd')
      const next = createEmptyProject(id, { language })
      next.projectIdea = idea.trim()
      next.projectName = deriveProjectName(idea)
      if (model) next.model = model
      setError(null)
      setProject(next)
      projectRef.current = next

      try {
        setLoadingStage('analyze')
        const data = await generateProjectAnalysis(next)
        next.aiAnalysis = normalizeAnalysis(data)
        projectRef.current = next
        setProject((cur) => (cur && cur.id === next.id ? { ...next } : cur))

        setLoadingStage('questions')
        const qData = await generateClarificationQuestions(next)
        const questions = normalizeQuestions(qData.questions)
        next.questions = questions
        // Baru pindah setelah AI benar-benar selesai; selama proses user tetap
        // melihat skeleton di halaman ide. Ide yang sudah cukup jelas → AI bisa
        // mengembalikan 0 pertanyaan: langsung ke tahap teknologi.
        next.step = questions.length ? 'clarify' : 'tech'
        projectRef.current = next
        setProject((cur) => (cur && cur.id === next.id ? { ...next } : cur))
        return questions
      } catch (e) {
        if (e instanceof AuthError) setNeedLogin(true)
        setError(e.message || 'Terjadi kesalahan')
        throw e
      } finally {
        setLoadingStage(null)
      }
    },
    [],
  )

  // Loncat tahap lewat stepper: blokir tahap yang prasyaratnya belum ada,
  // jangan sampai mendarat di halaman kosong.
  const gotoStep = useCallback(
    (target) => {
      if (isWorking) return
      const p = projectRef.current
      if (target === 'clarify' && !p?.questions?.length) return
      if (target === 'structure') {
        const hasStack = Object.values(p?.technologyStack || {}).some((v) => v)
        if (p?.technologySelectionMode !== 'manual' && !hasStack) return
      }
      if (target === 'prd' && !p?.productStructure?.features?.length) return
      updateProject({ step: target })
    },
    [isWorking, updateProject],
  )

  const resetProject = useCallback(() => {
    setProject(null)
    setError(null)
    setLoadingStage(null)
  }, [])

  const dismissError = useCallback(() => setError(null), [])
  const dismissNeedLogin = useCallback(() => setNeedLogin(false), [])

  return {
    project,
    step,
    stepIndex,
    qaPairs: project ? collectQAPairs(project) : [],
    isWorking,
    loadingStage,
    loadingMessage,
    loadingProject,
    error,
    needLogin,
    persistError,
    history,
    refreshHistory,
    deleteProjectFromHistory,
    startFromIdea,
    runQuestions,
    runTech,
    runStructure,
    runPRD,
    runRegenerateSection,
    setAnswer,
    setStructure,
    setPRDSections,
    updateProject,
    gotoStep,
    resetProject,
    dismissError,
    dismissNeedLogin,
  }
}

// --- helper riwayat ---------------------------------------------------------

// Meta ringan untuk dialog riwayat (tanpa isi project).
function toMeta(p) {
  return { id: p.id, projectName: p.projectName || '', createdAt: p.createdAt, updatedAt: p.updatedAt }
}

// Gabung meta server + lokal (server menang bila id sama), urut terbaru.
function mergeMetas(server, local) {
  const byId = new Map()
  for (const m of server) byId.set(m.id, m)
  for (const m of local) if (!byId.has(m.id)) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

// Upsert satu meta ke daftar riwayat (setelah save sukses).
function upsertMeta(list, project) {
  const next = list.filter((m) => m.id !== project.id)
  next.unshift(toMeta(project))
  return next
}

// Section hasil regenerate: pertahankan id lama oleh caller, di sini cukup
// normalisasi bentuknya (id baru digenerate bila AI tidak kirim).
function normalizeSectionClient(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null
  const title = String(raw.title || raw.heading || raw.name || '').trim().slice(0, 120)
  const content = typeof raw.content === 'string' ? raw.content.trim() : ''
  if (!title || !content) return null
  const status = raw.status === SECTION_STATUS.NEEDS ? SECTION_STATUS.NEEDS : SECTION_STATUS.OK
  return { id: String(raw.id || `sec_${Date.now()}_${index}`).slice(0, 60), title, content, status }
}
