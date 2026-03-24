// ─── SUBJECTS & CONTENT ─────────────────────────────────────────────────────

export type SubjectSlug =
  | 'cybersecurity'
  | 'networking'
  | 'linux'
  | 'cloud-computing'
  | 'ai-ml'
  | 'software-development'
  | 'systems-administration'

export interface Subject {
  id: string
  name: string
  slug: SubjectSlug
  icon: string
  color: string
  description: string
  topics: Topic[]
}

export interface Topic {
  id: string
  subjectId: string
  name: string
  slug: string
  description: string
  difficultyLevels: DifficultyLevel[]
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type SessionMode = 'competitive' | 'cooperative' | 'individual'
export type ScenarioStatus = 'draft' | 'published' | 'archived'
export type TaskType = 'flag' | 'text' | 'code' | 'command' | 'multiple-choice'

// ─── SCENARIO ───────────────────────────────────────────────────────────────

export interface GenerationParams {
  subject: SubjectSlug
  topic: string
  difficulty: DifficultyLevel
  timeLimit: number       // minutes
  teamSize: number
  mode: SessionMode
  learningObjectives: string[]
  answers: Record<string, string>   // the 5 instructor questions
}

export interface Scenario {
  id: string
  subjectId: string
  topicId: string
  title: string
  story: string           // 2–3 paragraph narrative
  briefing: string        // shorter mission brief for students
  difficulty: DifficultyLevel
  estimatedTime: number   // minutes
  aiGenerated: boolean
  generationParams: GenerationParams
  status: ScenarioStatus
  createdBy: string       // instructor uid
  createdAt: number       // timestamp
  updatedAt: number
  timesUsed: number
  avgScore: number
  tasks: Task[]
  resources: Resource[]
  injectEvents: InjectEvent[]
  toolsAvailable: ToolType[]
}

export type ToolType = 'terminal' | 'code-editor' | 'file-viewer' | 'network-diagram'

export interface Task {
  id: string
  scenarioId: string
  title: string
  description: string
  type: TaskType
  points: number
  correctAnswer: string
  hints: Hint[]
  orderIndex: number
  unlockCondition?: string   // e.g. "task_1_complete"
  validationScript?: string  // for terminal tasks
}

export interface Hint {
  id: string
  text: string
  pointsCost: number
  orderIndex: number
}

export interface Resource {
  id: string
  scenarioId: string
  name: string
  type: 'log' | 'config' | 'code' | 'csv' | 'image' | 'text' | 'network-config'
  content: string
  isDistractor: boolean
  unlockCondition?: string   // e.g. "task_2_complete" or null = available from start
}

export interface InjectEvent {
  id: string
  scenarioId: string
  title: string
  content: string
  triggerType: 'time' | 'manual' | 'condition'
  triggerTime?: number       // minutes from session start
  triggerCondition?: string  // e.g. "team_completes_task_2"
  target: 'all' | 'specific'
  scoreImpact: number        // positive = bonus, negative = penalty
  unlocksResources?: string[]
  addsTask?: Partial<Task>
  updatesNetwork?: Record<string, unknown>
  fired: boolean
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export type UserRole = 'instructor' | 'student' | 'admin'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  avatarColor: string
  university: string
  subjectInterests: SubjectSlug[]
  createdAt: number
}

// ─── TEAMS & SESSIONS ────────────────────────────────────────────────────────

export interface Team {
  id: string
  name: string
  color: string
  avatar: string
  sessionId: string
  members: TeamMember[]
  score: number
  rank: number
  tasksCompleted: string[]
  hintsUsed: number
  completedAt?: number
}

export interface TeamMember {
  uid: string
  displayName: string
  avatarColor: string
  joinedAt: number
  isOnline: boolean
}

export type SessionStatus = 'waiting' | 'active' | 'paused' | 'ended'

export interface Session {
  id: string
  scenarioId: string
  instructorId: string
  mode: SessionMode
  status: SessionStatus
  timeLimit: number        // minutes
  startedAt?: number
  endedAt?: number
  teamIds: string[]
  settings: SessionSettings
  accessCode: string       // 6-char code students use to join
}

export interface SessionSettings {
  showLeaderboard: boolean
  allowHints: boolean
  hintPenalty: number
  wrongAnswerPenalty: number
  firstBloodBonus: number
  timeBonus: boolean
}

// ─── SUBMISSIONS & PROGRESS ──────────────────────────────────────────────────

export interface Submission {
  id: string
  sessionId: string
  teamId: string
  userId: string
  taskId: string
  answer: string
  isCorrect: boolean
  pointsAwarded: number
  submittedAt: number
}

export interface HintRequest {
  id: string
  sessionId: string
  teamId: string
  taskId: string
  hintIndex: number
  pointsDeducted: number
  requestedAt: number
}

export interface StudentProgress {
  userId: string
  subjectId: string
  topicId: string
  proficiencyScore: number
  sessionsCompleted: number
  lastActivity: number
}

// ─── REAL-TIME (Firebase RTDB) ───────────────────────────────────────────────

export interface LiveSession {
  status: SessionStatus
  startedAt: number
  timeRemaining: number   // seconds
  teams: Record<string, LiveTeam>
  events: Record<string, LiveEvent>
  chat: Record<string, ChatMessage>
  firedInjects: string[]
}

export interface LiveTeam {
  score: number
  rank: number
  tasksCompleted: string[]
  lastActivity: number
  membersOnline: string[]
}

export interface LiveEvent {
  type: 'task_complete' | 'hint_used' | 'inject_fired' | 'wrong_answer' | 'session_start' | 'session_end'
  teamId: string
  teamName: string
  teamColor: string
  payload: Record<string, unknown>
  timestamp: number
}

export interface ChatMessage {
  id: string
  teamId: string
  userId: string
  displayName: string
  avatarColor: string
  message: string
  sentAt: number
}

// ─── AI GENERATION ───────────────────────────────────────────────────────────

export interface GenerationJob {
  id: string
  status: 'pending' | 'generating' | 'complete' | 'error'
  params: GenerationParams
  scenarioId?: string
  error?: string
  createdAt: number
  completedAt?: number
}

export interface ScenarioGenerationResult {
  scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt' | 'timesUsed' | 'avgScore'>
}
