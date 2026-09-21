import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Sun, Moon, X } from 'lucide-react'

import { Button } from '../components/ui/button'
import { LoginDialog } from '../components/LoginDialog'
import { AppSidebar } from '../components/AppSidebar'
import { Stepper } from '../components/prd/Stepper'
import { IdeaInput } from '../components/prd/IdeaInput'
import { Clarify } from '../components/prd/Clarify'
import { TechPref } from '../components/prd/TechPref'
import { Structure } from '../components/prd/Structure'
import { PrdEditor } from '../components/prd/PrdEditor'
import { ContextPanel } from '../components/prd/ContextPanel'
import { usePrdProject } from '../hooks/usePrdProject'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../lib/use-theme'
import { usePageMeta } from '../lib/seo'
import { LogoImg } from '../lib/logo-img'
import { loadModel } from '../lib/models'

const STEP_NAMES = ['idea', 'clarify', 'tech', 'structure', 'prd']

/**
 * Halaman PRD Builder (/prd-builder, /prd-builder/:projectId).
 *
 * Hanya shell: header ala LegalPage existing + stepper adaptif + canvas yang
 * merender step komponen. Semua logika tahap & persistensi ada di hook
 * usePrdProject; panggilan AI di lib/prd-api; prompt di worker/src/prd.js.
 *
 * Auth: halaman terbuka, tapi aksi AI butuh session — LoginDialog muncul
 * saat pengguna belum login (sama dengan alur /chat). Ide yang tertahan
 * dikirim otomatis begitu login berhasil.
 */
export function PrdBuilderPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [theme, setTheme] = useTheme()
  const model = useMemo(loadModel, [])
  const { loginWithGoogle } = useAuth()

  // Dibuat sebelum usePrdProject: efek deep-link di hook menandai saat URL
  // yang memimpin (klik riwayat / deep-link); efek store→URL di bawah
  // memakainya untuk skip satu putaran. Tanpa ini kedua efek saling dorong
  // URL ↔ project dan halaman flicker saat pindah antar riwayat.
  const urlLeads = useRef(false)

  const prd = usePrdProject({ projectParam: projectId, urlLeads })
  const {
    project,
    step,
    stepIndex,
    isWorking,
    loadingMessage,
    error,
    needLogin,
    persistError,
    savedAt,
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
  } = prd

  const [qIndex, setQIndex] = useState(0)

  // Ide & bahasa sebelum tekan Mulai; juga dipakai deep-link project lama.
  // Sinkron ulang setiap project berganti (mis. buka item riwayat lain) —
  // khususnya untuk project yang masih di tahap ide.
  const [pendingIdea, setPendingIdea] = useState('')
  const [pendingLang, setPendingLang] = useState('id')
  useEffect(() => {
    if (project?.projectIdea) {
      setPendingIdea(project.projectIdea)
      setPendingLang(project.language || 'id')
    }
  }, [project?.id])

  // Aksi AI yang tertunda karena belum login; dikirim ulang setelah session.
  const pendingAction = useRef(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginErr, setLoginErr] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  usePageMeta({
    title: 'PRD Builder',
    description: 'Ubah ide aplikasi kamu menjadi Product Requirements Document lengkap bersama AI KeyzAI.',
    path: '/prd-builder',
  })

  // Sinkron URL dengan project aktif (pola /chat/:convId). urlLeads dicegah
  // di sini: saat URL yang memimpin (klik riwayat / deep-link), efek
  // usePrdProject sudah menandai bahwa ia sedang memuat project dari URL ini.
  // Tanpa guard ini, efek store→URL memantulkan URL ke project lama sebelum
  // pemuatan selesai → kedua efek saling dorong dan halaman flicker.
  useEffect(() => {
    if (urlLeads.current) {
      urlLeads.current = false
      return
    }
    if (project?.id && projectId !== project.id) {
      navigate(`/prd-builder/${project.id}`, { replace: true })
    }
  }, [project?.id, projectId, navigate])

  // Reset indeks pertanyaan saat daftar pertanyaan berganti.
  useEffect(() => {
    setQIndex(0)
  }, [project?.questions?.length])

  // ---------- handlers ----------------------------------------------------

  // Memulai: jika belum login, simpan ide sebagai pending lalu tampilkan
  // popup. Setelah login sukses, pending dilanjutkan (handleLoginToken).
  const handleStart = useCallback(
    ({ idea, language }) => {
      setPendingIdea(idea)
      setPendingLang(language)
      pendingAction.current = { type: 'start', idea, language }
      startFromIdea({ idea, language, model }).catch(() => {
        // error sudah ditangani di hook (needLogin / error)
      })
    },
    [startFromIdea, model],
  )

  const handleLoginToken = useCallback(
    async (idToken) => {
      setLoginErr(null)
      setLoginLoading(true)
      try {
        await loginWithGoogle(idToken)
        dismissNeedLogin()
        const pending = pendingAction.current
        pendingAction.current = null
        if (pending?.type === 'start') {
          // session baru: ulang alur mulai dengan ide yang tertahan
          startFromIdea({ idea: pending.idea, language: pending.language, model }).catch(() => {})
        }
      } catch (e) {
        setLoginErr(e.message || 'Login gagal')
      } finally {
        setLoginLoading(false)
      }
    },
    [loginWithGoogle, dismissNeedLogin, startFromIdea, model],
  )

  const handleNextQ = useCallback(() => {
    const total = project?.questions?.length || 0
    if (qIndex < total - 1) {
      setQIndex((i) => i + 1)
    } else {
      // pertanyaan habis → lanjut ke teknologi
      updateProject({ step: 'tech' })
    }
  }, [qIndex, project?.questions?.length, updateProject])

  // Lewati = kosongkan jawaban lalu maju sama seperti "Berikutnya" (di
  // pertanyaan terakhir → lanjut ke teknologi, bukan diam).
  const handleSkip = useCallback(
    (qid) => {
      setAnswer(qid, null)
      handleNextQ()
    },
    [setAnswer, handleNextQ],
  )

  const handleSelectTechMode = useCallback(
    (mode) => {
      updateProject({ technologySelectionMode: mode })
      if (mode === 'auto') runTech('auto').catch(() => {})
    },
    [updateProject, runTech],
  )

  const handleManualTech = useCallback(
    (key, value) => {
      updateProject({
        technologyStack: { ...project?.technologyStack, [key]: value },
      })
    },
    [updateProject, project?.technologyStack],
  )

  const handleTechContinue = useCallback(() => {
    const stack = project?.technologyStack || {}
    const hasStack = Object.values(stack).some((v) => v)
    const goToStructure = () => {
      updateProject({ step: 'structure' })
      // Struktur belum pernah dibuat → generate otomatis, bukan minta user
      // menekan "Regenerate" di halaman yang baru dibuka.
      const existing = project?.productStructure?.features || []
      if (existing.length === 0) runStructure().catch(() => {})
    }
    if (project?.technologySelectionMode === 'auto' && !hasStack) {
      runTech('auto')
        .then(goToStructure)
        .catch(() => {})
      return
    }
    goToStructure()
  }, [project, runTech, runStructure, updateProject])

  const handleStructureContinue = useCallback(() => {
    updateProject({ step: 'prd' })
    runPRD().catch(() => {})
  }, [updateProject, runPRD])

  const handleNewPrd = useCallback(() => {
    resetProject()
    setPendingIdea('')
    setPendingLang('id')
    setQIndex(0)
    pendingAction.current = null
    navigate('/prd-builder', { replace: true })
  }, [resetProject, navigate])

  // PRD aktif dihapus dari sidebar → kembali ke kanvas ide (jangan biarkan
  // auto-save menghidupkan ulang project yang sudah dihapus).
  const handlePrdRemoved = useCallback(
    (id) => {
      if (project?.id !== id) return
      resetProject()
      setPendingIdea('')
      setPendingLang('id')
      setQIndex(0)
      pendingAction.current = null
      navigate('/prd-builder', { replace: true })
    },
    [project?.id, resetProject, navigate],
  )

  const handleBackToChat = useCallback(() => {
    navigate('/chat')
  }, [navigate])

  const retry = useCallback(
    (fn) => {
      dismissError()
      fn().catch(() => {})
    },
    [dismissError],
  )

  // ---------- render ------------------------------------------------------

  const showStepper = !!project && step !== 'idea'

  const stepCanvas =
    step === 'idea' || !project ? (
      <IdeaInput
        initialIdea={pendingIdea}
        initialLanguage={pendingLang}
        loading={isWorking}
        loadingMessage={loadingMessage}
        error={error}
        onStart={(v) => {
          setPendingIdea(v.idea)
          setPendingLang(v.language)
          handleStart(v)
        }}
      />
    ) : step === 'clarify' ? (
      <Clarify
        questions={project.questions || []}
        answers={project.answers || {}}
        index={qIndex}
        onAnswer={setAnswer}
        onPrev={() => setQIndex((i) => Math.max(0, i - 1))}
        onNext={handleNextQ}
        onSkip={handleSkip}
        loading={isWorking}
        loadingMessage={loadingMessage}
        error={error}
        onRetry={() => retry(runQuestions)}
      />
    ) : step === 'tech' ? (
      <TechPref
        mode={project.technologySelectionMode}
        stack={project.technologyStack}
        onSelectMode={handleSelectTechMode}
        onManualChange={handleManualTech}
        loading={isWorking}
        loadingMessage={loadingMessage}
        onContinue={handleTechContinue}
        onBack={() => gotoStep('clarify')}
      />
    ) : step === 'structure' ? (
      <Structure
        structure={project.productStructure}
        onChange={setStructure}
        onRegenerate={() => retry(runStructure)}
        onContinue={handleStructureContinue}
        onBack={() => gotoStep('tech')}
        loading={isWorking}
        loadingMessage={loadingMessage}
        error={error}
        onRetry={() => retry(runStructure)}
      />
    ) : (
      <PrdEditor
        project={project}
        sections={project.prd?.sections || []}
        onChangeSections={setPRDSections}
        onRegenerateSection={runRegenerateSection}
        onBack={() => gotoStep('structure')}
        onNew={handleNewPrd}
        loading={isWorking}
        loadingMessage={loadingMessage}
        error={error}
        onRetry={() => retry(runPRD)}
      />
    )

  return (
    <AppSidebar
      collapsed={sidebarCollapsed}
      mobileOpen={sidebarOpen}
      onMobileClose={() => setSidebarOpen(false)}
      showConversations={false}
      currentPrdId={project?.id}
      onAfterDeletePrd={handlePrdRemoved}
      onNewPrd={handleNewPrd}
    >
      <header className="relative z-20 flex h-14 flex-shrink-0 items-center justify-between bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex -ml-2"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
            <Link to="/" aria-label="Kembali ke beranda" className="rounded-xl transition-opacity hover:opacity-80">
              <LogoImg className="h-8 w-auto" />
            </Link>
          </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label="Ganti tema"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Buka/tutup sidebar"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBackToChat} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kembali ke chat</span>
            <span className="sm:hidden">Chat</span>
          </Button>
        </div>

        {showStepper && (
          <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
            <Stepper stepIndex={stepIndex} disabled={isWorking} onJump={(i) => gotoStep(STEP_NAMES[i])} />
          </div>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-10 sm:px-6 sm:py-16">
        {project ? (
          // 2 kolom: canvas step di kiri, ringkasan konteks proyek (sticky)
          // di kanan. Project baru selalu punya ide → panel tidak kosong.
          <div className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">{stepCanvas}</div>
            <ContextPanel project={project} working={isWorking} loadingMessage={loadingMessage} savedAt={savedAt} onRename={updateProject} />
          </div>
        ) : (
          <div className="relative flex min-h-full flex-1 items-center justify-center py-6">
            <div className="pointer-events-none absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_42%,black,transparent)]" />
            <div className="relative w-full">{stepCanvas}</div>
          </div>
        )}

        {persistError && (
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-destructive" role="alert">
            {persistError}
          </p>
        )}
      </main>

      <LoginDialog
        open={needLogin}
        onOpenChange={(o) => {
          if (!o) {
            dismissNeedLogin()
            pendingAction.current = null
          }
        }}
        onIdToken={handleLoginToken}
        loading={loginLoading}
        error={loginErr}
      />
    </AppSidebar>
  )
}
