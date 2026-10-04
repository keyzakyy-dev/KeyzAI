import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Download, FileJson, RotateCcw, SkipForward } from 'lucide-react'

import { Button } from '../components/ui/button'
import { CopyButton } from '../lib/copy-button'
import { exportJSON, exportMarkdown, projectToMarkdown } from '../lib/prd-export'
import { LoginDialog } from '../components/LoginDialog'
import { AppSidebar } from '../components/AppSidebar'
import { Stepper } from '../components/prd/Stepper'
import { StageNav } from '../components/prd/StepHeader'
import { IdeaIntro, IdeaComposer } from '../components/prd/IdeaInput'
import { Clarify } from '../components/prd/Clarify'
import { TechPref } from '../components/prd/TechPref'
import { Structure } from '../components/prd/Structure'
import { PrdEditor } from '../components/prd/PrdEditor'
import { usePrdProject } from '../hooks/usePrdProject'
import { useAuth } from '../hooks/useAuth'
import { usePageMeta } from '../lib/seo'

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
    maxStepIndex,
    isWorking,
    loadingMessage,
    error,
    needLogin,
    persistError,
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
  // Draf komposer ide: dimiliki halaman agar sapaan (output) dan komposer
  // (panel aksi bawah) berbagi isi yang sama, seperti ChatInput di /chat.
  // Diinisialisasi sekali seperti useState(initialIdea) di IdeaInput lama.
  const [ideaDraft, setIdeaDraft] = useState(pendingIdea)
  const [ideaLang, setIdeaLang] = useState(pendingLang)

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

  // Stepper tetap tampil saat user mundur ke tahap ide tapi project sudah
  // punya progres — kalau tidak, tidak ada jalan kembali ke tahap selesai.
  const showStepper = !!project && (step !== 'idea' || maxStepIndex > 0)

  const stepCanvas =
    step === 'idea' || !project ? (
      <IdeaIntro
        showExamples={!isWorking && ideaDraft.length === 0}
        onSelect={(ex) => setIdeaDraft(ex)}
      />
    ) : step === 'clarify' ? (
      <Clarify
        questions={project.questions || []}
        answers={project.answers || {}}
        index={qIndex}
        onAnswer={setAnswer}
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
      />
    ) : step === 'structure' ? (
      <Structure
        structure={project.productStructure}
        onChange={setStructure}
        onRegenerate={() => retry(runStructure)}
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
        loading={isWorking}
        loadingMessage={loadingMessage}
        error={error}
        onRetry={() => retry(runPRD)}
      />
    )

  // ---------- komposisi layout ala /chat ------------------------------------
  // Navigasi tiap tahap (dulu di dalam komponen step) diangkat ke panel aksi
  // bawah. Semua state/handler sudah dimiliki halaman ini — tidak ada logika
  // baru, hanya lokasi render yang pindah.
  const currentQ = step === 'clarify' ? project?.questions?.[qIndex] : null
  const isLastQ = currentQ ? qIndex >= (project?.questions?.length || 0) - 1 : false
  const features = project?.productStructure?.features || []
  const md = project ? projectToMarkdown(project) : ''

  const actionBar =
    step === 'idea' || !project ? (
      <IdeaComposer
        idea={ideaDraft}
        language={ideaLang}
        onIdeaChange={setIdeaDraft}
        onLanguageChange={setIdeaLang}
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
      currentQ ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" onClick={() => setQIndex((i) => Math.max(0, i - 1))} disabled={qIndex === 0} className="h-11 gap-1.5 self-start sm:h-8 sm:self-auto">
            <ArrowLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleSkip(currentQ.id)} className="h-11 gap-1.5 sm:h-8">
              <SkipForward className="h-3.5 w-3.5" />
              Lewati
            </Button>
            <Button onClick={handleNextQ} size="sm" className="h-11 gap-1.5 sm:h-8">
              {isLastQ ? 'Lanjut' : 'Berikutnya'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="tui-prompt font-bold" aria-hidden="true">› </span>
          menunggu pertanyaan…
        </p>
      )
    ) : step === 'tech' ? (
      <StageNav onBack={() => gotoStep('clarify')} onNext={handleTechContinue} nextDisabled={isWorking} nextLabel={isWorking ? 'Memproses…' : 'Lanjut ke struktur'} />
    ) : step === 'structure' ? (
      <StageNav
        onBack={() => gotoStep('tech')}
        onNext={handleStructureContinue}
        nextDisabled={isWorking || features.length === 0}
        nextLabel="Lanjut ke PRD"
      >
        <Button variant="outline" size="sm" onClick={() => retry(runStructure)} disabled={isWorking} className="h-11 gap-1.5 sm:h-8">
          <RotateCcw className="h-3.5 w-3.5" />
          Generate ulang
        </Button>
      </StageNav>
    ) : (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={md} withLabel className="h-11 rounded-sm border border-border px-4 sm:h-9" />
          <Button variant="outline" size="sm" onClick={() => exportMarkdown(project)} className="h-11 gap-1.5 px-4 sm:h-9 sm:px-3">
            <Download className="h-3.5 w-3.5" />
            Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportJSON(project)} className="h-11 gap-1.5 px-4 sm:h-9 sm:px-3">
            <FileJson className="h-3.5 w-3.5" />
            JSON
          </Button>
          <span className="text-[11px] text-muted-foreground">
            PDF/DOCX segera
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => gotoStep('structure')} className="h-11 gap-1.5 sm:h-8">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali
          </Button>
          <Button variant="outline" size="sm" onClick={handleNewPrd} className="h-11 sm:h-8">
            PRD baru
          </Button>
        </div>
      </div>
    )

  const statusBar = (
    <div className="relative flex flex-shrink-0 items-center gap-x-2 gap-y-0.5 px-1 py-1 text-[11px] leading-relaxed text-muted-foreground lg:col-span-2" aria-live="polite">
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        <span className={`inline-block h-1.5 w-1.5 ${isWorking ? 'bg-orange-400' : 'bg-emerald-400'}`} />
        <span className={`inline-block h-1.5 w-1.5 ${isWorking ? 'bg-orange-400/60' : 'bg-foreground/25'}`} />
        <span className="inline-block h-1.5 w-1.5 bg-foreground/25" />
      </span>
      <span className={`px-1 py-px text-[10px] font-bold uppercase tracking-wider ${isWorking ? 'tui-badge-working' : 'tui-badge-idle'}`}>
        {isWorking ? 'working' : 'idle'}
      </span>
      <span className="tui-accent font-semibold">keyzai</span>
      <span className="text-muted-foreground">·</span>
      <span className="min-w-0 flex-1 truncate">
        {isWorking ? (loadingMessage || 'bekerja…') : 'idle · siap'}
      </span>
      <span className="shrink-0 tabular-nums">
        tahap {stepIndex + 1}/{STEP_NAMES.length}
      </span>
    </div>
  )

  const projectMeta = {
    name: project?.projectName,
    stepIndex,
    totalSteps: STEP_NAMES.length,
    isWorking,
    statusText: loadingMessage,
    modelId: model,
  }

  const headerNode = (
    <div className="flex min-w-0 items-center gap-2 text-xs">
      <Button variant="ghost" size="sm" onClick={handleBackToChat} className="gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Kembali ke chat</span>
        <span className="sm:hidden">Chat</span>
      </Button>
      <span className="shrink-0 select-none text-muted-foreground/50" aria-hidden="true">·</span>
      <p className="min-w-0 truncate text-muted-foreground">
        {project?.projectName || 'PRD Builder'}
      </p>
    </div>
  )

  return (
    <AppSidebar
      header={headerNode}
      panelTitle={STEP_NAMES[stepIndex] || 'idea'}
      stepper={showStepper && (
        <Stepper stepIndex={stepIndex} maxIndex={maxStepIndex} disabled={isWorking} onJump={(i) => gotoStep(STEP_NAMES[i])} />
      )}
      actionBar={actionBar}
      statusBar={statusBar}
      projectMeta={projectMeta}
      currentPrdId={project?.id}
      onAfterDeletePrd={handlePrdRemoved}
      onNewPrd={handleNewPrd}
    >
      {/* Lebar per tahap dimiliki komponen step sendiri (satu sumber, tanpa
          cap ganda di sini). */}
      {project ? (
        <div className="w-full">{stepCanvas}</div>
      ) : (
        <div className="flex min-h-full flex-1 items-center justify-center py-6">
          <div className="w-full">{stepCanvas}</div>
        </div>
      )}

      {persistError && (
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-destructive" role="alert">
          {persistError}
        </p>
      )}

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
        reason="prd"
        pendingMessage={pendingAction.current?.idea || pendingIdea}
      />
    </AppSidebar>
  )
}
