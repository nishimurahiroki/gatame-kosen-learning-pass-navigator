import { AnimatePresence, motion } from 'framer-motion'
import AssessmentStatementList from '../assessment/AssessmentStatementList'
import { useMembershipAccess } from '../../context/MembershipAccessContext'
import en from '../../locales/en.json'

const ANNUAL_CHOICES = en.assessment.annualMembershipChoices.map((row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
}))

export type AnnualMembershipAskModalProps = {
  open: boolean
}

export default function AnnualMembershipAskModal({ open }: AnnualMembershipAskModalProps) {
  const { setAnnualMembership } = useMembershipAccess()

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[125] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="annual-ask-title"
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl border border-gatame-gold/40 bg-gatame-midnight px-6 py-7 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:px-8"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
          >
            <h2 id="annual-ask-title" className="text-lg font-semibold text-gatame-gold sm:text-xl">
              {en.assessment.q4AnnualTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{en.assessment.q4AnnualHint}</p>
            <div className="mt-5">
              <AssessmentStatementList
                aria-labelledby="annual-ask-title"
                items={ANNUAL_CHOICES}
                onSelect={(id) => setAnnualMembership(id === 'yes')}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
