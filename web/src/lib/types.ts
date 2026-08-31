export type CourseSummary = {
  code: string
  legacyNumber: number
  slug: string
  group: string
  order: number
  featured: boolean
  title: string
  shortTitle: string
  tagline: string
  duration: string
  durationDays: number
  outputSummary: string
  headcount: string
  softwareName: string
  moduleCount: number
  recipients: string
}

export type SoftwareModule = { no: number; name: string; description: string }

export type CourseDay = {
  no: number
  title: string
  subtitle: string
  topics: string[]
  output: string
}

export type Course = CourseSummary & {
  method: string
  intro: string[]
  coreGoal: string
  highlight: { label?: string; text?: string }
  objectives: string[]
  values: { title: string; description: string }[]
  audience: {
    note?: string
    headcount?: string
    rows?: { role: string; duty: string }[]
    priorityUnits?: string
  }
  days: CourseDay[]
  deliverables: string[]
  software: {
    name?: string
    intro?: string
    modules?: SoftwareModule[]
    scope?: string
    note?: string
  }
  kpis: { note?: string; rows?: { metric: string; target: string }[]; caveat?: string }
  dataToBring: string[]
  roadmap: string[]
  longTermGoal: string
  motto: string
  responsibleAi: string[]
  relatedCourses: { code: string; reason: string }[]
}

export type CourseGroup = {
  id: string
  name: string
  shortName: string
  description: string
  targetUnits: string
  accent: string
  order: number
}

export type Faq = {
  id: string
  question: string
  answer: string
  category: string
  courseCodes: string[]
  priority: number
  order: number
}

export type SiteContent = {
  programName: string
  organizer: string
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    primaryCta: { label: string; href: string }
    secondaryCta: { label: string; href: string }
  }
  stats: { value: number; suffix: string; label: string; note: string }[]
  differentiators: { title: string; description: string }[]
  roadmap: { step: string; description: string }[]
  responsibleAi: {
    title: string
    intro: string
    rules: { courseCode: string; text: string }[]
    kpiNote: string
  }
  contact: {
    unit: string
    address: string
    email: string
    phone: string
    registrationDeadline: string
    note: string
  }
  chat: { greeting: string; suggestions: string[]; fallback: string }
  stats_?: never
}

export type Citation = {
  chunkId: string
  courseCode: string | null
  section: string
  title: string
  score: number
}

export type RecommendItem = {
  code: string
  slug: string
  shortTitle: string
  duration: string
  score: number
  reasons: string[]
  headcount: string
}

export type RecommendResponse = {
  primary: RecommendItem[]
  alternatives: RecommendItem[]
  note: string
}

export type SoftwareGroup = {
  courseCode: string
  courseSlug: string
  courseName: string
  shortTitle: string
  suiteName: string
  intro: string
  scope: string
  note: string
  modules: SoftwareModule[]
}
