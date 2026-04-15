import { useCallback, useState } from 'react'
import { Check, Copy, Loader2, Mic, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { analyzeComplaint } from '@/lib/sadakbolo/ComplaintAnalyzer'
import { saveComplaint } from '@/lib/sadakbolo/api'
import { escalatedMessage, formalComplaint } from '@/lib/sadakbolo/TextFormatter'
import type { AnalysisResult, SadakReport } from '@/lib/sadakbolo/types'

type Props = {
  reportLat: number
  reportLng: number
  locationLabel: string
  existingReports: SadakReport[]
  onSubmitted: (report: SadakReport) => void
}

export function SadakBolo({
  reportLat,
  reportLng,
  locationLabel,
  existingReports,
  onSubmitted,
}: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [voiceSimulated, setVoiceSimulated] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [formalOut, setFormalOut] = useState('')
  const [escalateOut, setEscalateOut] = useState('')
  const [submitOk, setSubmitOk] = useState(false)
  const [voiceBusy, setVoiceBusy] = useState(false)

  const resetFlow = useCallback(() => {
    setResult(null)
    setFormalOut('')
    setEscalateOut('')
    setSubmitOk(false)
    setVoiceSimulated(false)
  }, [])

  const handleAnalyze = () => {
    setAnalyzing(true)
    setSubmitOk(false)
    setFormalOut('')
    setEscalateOut('')
    window.setTimeout(() => {
      const r = analyzeComplaint({
        text,
        imageFileName: imageFile?.name ?? null,
        voiceSimulated,
        lat: reportLat,
        lng: reportLng,
        existingReports,
      })
      setResult(r)
      setAnalyzing(false)
    }, 420)
  }

  const handleVoiceSimulate = () => {
    setVoiceBusy(true)
    window.setTimeout(() => {
      setText(
        'Urgent help: dangerous waterlogging after rain and a broken traffic signal — heavy jam and vehicles skidding.',
      )
      setVoiceSimulated(true)
      setVoiceBusy(false)
    }, 900)
  }

  const handleSubmit = async () => {
    if (!result) return
    const report: SadakReport = {
      id: crypto.randomUUID(),
      lat: reportLat,
      lng: reportLng,
      type: result.issueType,
      severity: result.severityScore,
      priority: result.priority,
      timestamp: Date.now(),
      text: text.trim() || undefined,
    }
    await saveComplaint(report)
    onSubmitted(report)
    setSubmitOk(true)
    window.setTimeout(() => {
      setOpen(false)
      resetFlow()
      setText('')
      setImageFile(null)
      setSubmitOk(false)
    }, 1600)
  }

  const copy = async (s: string) => {
    try {
      await navigator.clipboard.writeText(s)
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          resetFlow()
        }}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full border border-white/20 bg-[#EE3F2C] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/50 transition hover:bg-[#d63b28]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Sparkles className="size-4" />
        SadakBolo
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sadakbolo-title"
        >
          <Card className="max-h-[min(92vh,880px)] w-full max-w-lg overflow-y-auto border-white/15 bg-[#0a0a0a] text-white">
            <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <CardTitle id="sadakbolo-title" className="text-lg text-white">
                  SadakBolo
                </CardTitle>
                <p className="mt-1 text-xs text-white/55">
                  Simulated triage — report near <span className="text-white/80">{locationLabel}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="size-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              {submitOk ? (
                <p className="rounded-lg border border-emerald-500/40 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-100">
                  Complaint successfully registered
                </p>
              ) : null}

              <div className="space-y-2">
                <Label>Upload image (optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  className="cursor-pointer border-white/15 bg-black/50 text-white file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white"
                  onChange={(e) => {
                    setImageFile(e.target.files?.[0] ?? null)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sadak-text">Text complaint</Label>
                <Textarea
                  id="sadak-text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value)
                    setVoiceSimulated(false)
                  }}
                  placeholder="Describe the issue — pothole, waterlogging, signal, traffic, accident…"
                  rows={4}
                  className="resize-y border-white/15 bg-black/50 text-white placeholder:text-white/35"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={voiceBusy}
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={handleVoiceSimulate}
                >
                  {voiceBusy ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Mic className="mr-2 size-4" />
                  )}
                  Voice (simulated)
                </Button>
                <span className="text-[11px] text-white/45">
                  Fills sample text — no microphone capture in demo.
                </span>
              </div>

              <Button
                type="button"
                disabled={analyzing}
                className="bg-[#EE3F2C] text-white hover:bg-[#d63b28]"
                onClick={handleAnalyze}
              >
                {analyzing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                Analyze complaint
              </Button>

              {result ? (
                <div className="space-y-3 rounded-xl border border-white/12 bg-black/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Analysis result</p>
                  <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-white/55">Issue type</dt>
                      <dd className="font-medium text-white">{result.issueType.replace('_', ' ')}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-white/55">Severity</dt>
                      <dd className="font-mono text-white">{result.severityScore}/10</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-white/55">Priority</dt>
                      <dd className="text-white">{result.priority}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-white/55">Duplicate found</dt>
                      <dd className="text-white">{result.duplicateFound ? 'Yes' : 'No'}</dd>
                    </div>
                    {result.duplicateMessage ? (
                      <p className="text-xs text-amber-200/90">{result.duplicateMessage}</p>
                    ) : null}
                    <div className="flex justify-between gap-2">
                      <dt className="text-white/55">Est. fix time</dt>
                      <dd className="text-white">{result.estimatedDays} days</dd>
                    </div>
                  </dl>

                  <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        const o = formalComplaint(text, locationLabel)
                        setFormalOut(o)
                      }}
                    >
                      Generate formal complaint
                    </Button>
                    {formalOut ? (
                      <div className="space-y-1">
                        <Textarea readOnly value={formalOut} rows={6} className="text-xs border-white/15 bg-black/60" />
                        <Button type="button" size="sm" variant="ghost" className="text-white/80" onClick={() => copy(formalOut)}>
                          <Copy className="mr-1 size-3" /> Copy
                        </Button>
                      </div>
                    ) : null}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => setEscalateOut(escalatedMessage())}
                    >
                      Escalate issue (RTI-style)
                    </Button>
                    {escalateOut ? (
                      <div className="space-y-1">
                        <Textarea readOnly value={escalateOut} rows={5} className="text-xs border-white/15 bg-black/60" />
                        <Button type="button" size="sm" variant="ghost" className="text-white/80" onClick={() => copy(escalateOut)}>
                          <Copy className="mr-1 size-3" /> Copy
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={handleSubmit}
                  >
                    <Check className="mr-2 size-4" />
                    Submit complaint
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  )
}
