import { useState } from 'react'
import type { FormEvent } from 'react'

import { FadeIn } from '@/components/FadeIn'
import { TargoButton } from '@/components/TargoButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function ContactSection() {
  const [sent, setSent] = useState(false)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section
      id="contact"
      className="scroll-mt-6 border-t border-white/8 bg-black px-8 py-20 md:px-16 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EE3F2C]">
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-bold uppercase tracking-[-0.04em] text-white md:text-[42px]">
            Get in touch
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65 md:text-base">
            Questions about the project, want to collaborate, or need help
            deploying your own safety hub? Drop us a line.
          </p>
          <div className="mt-10 space-y-2 text-sm text-white/55">
            <p>
              <span className="text-white/80">Team</span> — Community Safety
              Project
            </p>
            <p>
              <span className="text-white/80">Email</span> — hello@targo.example
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-white/12 bg-white/3 p-6 md:p-8"
          >
            <div className="grid gap-5">
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first">First name</Label>
                  <Input
                    id="first"
                    name="first"
                    required
                    autoComplete="given-name"
                    placeholder="Alex"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last">Last name</Label>
                  <Input
                    id="last"
                    name="last"
                    required
                    autoComplete="family-name"
                    placeholder="Rivera"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  placeholder="What would you like to discuss?"
                  className="min-h-[120px] resize-y"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <TargoButton type="submit" look="brand" size="lg" className="px-8">
                  Send message
                </TargoButton>
                {sent ? (
                  <p className="text-sm text-white/70" role="status">
                    Thanks — we&apos;ll be in touch.
                  </p>
                ) : null}
              </div>
            </div>
          </form>
        </FadeIn>
      </div>
    </section>
  )
}
