import { createClientSupabase } from '@/lib/supabase'
import { getLevelFromXP } from '@/lib/levels'

export type MissionTrigger =
  | 'dashboard_visited'
  | 'task_created'
  | 'task_completed'
  | 'checkin_saved'
  | 'transaction_added'
  | 'event_added'
  | 'goal_updated'
  | 'goal_completed'

export type DailyMission = {
  id: string
  user_id: string
  date: string
  mission_type: string
  title: string
  description: string | null
  xp_reward: number
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export type MissionResult = {
  missionId: string
  title: string
  xpAwarded: number
}

type MissionDef = {
  type: string
  title: string
  description: string
  xp_reward: number
  minPlan: 'free' | 'pro' | 'elite'
  trigger: MissionTrigger
  countNeeded?: number
}

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, elite: 2 }

function planAllowed(userPlan: string, minPlan: string): boolean {
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[minPlan] ?? 0)
}

const MISSION_DEFS: MissionDef[] = [
  {
    type: 'dashboard_visited',
    title: 'Primeiro acesso do dia',
    description: 'Acesse o dashboard hoje',
    xp_reward: 10,
    minPlan: 'free',
    trigger: 'dashboard_visited',
  },
  {
    type: 'task_created',
    title: 'Criador de tarefas',
    description: 'Crie uma tarefa hoje',
    xp_reward: 15,
    minPlan: 'free',
    trigger: 'task_created',
  },
  {
    type: 'task_completed',
    title: 'Tarefa concluída',
    description: 'Complete uma tarefa hoje',
    xp_reward: 20,
    minPlan: 'free',
    trigger: 'task_completed',
  },
  {
    type: 'checkin_saved',
    title: 'Check-in do dia',
    description: 'Registre seu humor hoje',
    xp_reward: 15,
    minPlan: 'free',
    trigger: 'checkin_saved',
  },
  {
    type: 'transaction_added',
    title: 'Controle financeiro',
    description: 'Registre uma transação hoje',
    xp_reward: 10,
    minPlan: 'free',
    trigger: 'transaction_added',
  },
  {
    type: 'event_added',
    title: 'Agenda organizada',
    description: 'Adicione um evento à agenda',
    xp_reward: 15,
    minPlan: 'pro',
    trigger: 'event_added',
  },
  {
    type: 'goal_updated',
    title: 'Progresso de meta',
    description: 'Atualize o progresso de uma meta',
    xp_reward: 20,
    minPlan: 'pro',
    trigger: 'goal_updated',
  },
  {
    type: 'goal_completed',
    title: 'Meta conquistada!',
    description: 'Complete uma meta hoje',
    xp_reward: 50,
    minPlan: 'pro',
    trigger: 'goal_completed',
  },
  {
    type: 'tasks_completed_3',
    title: 'Produtividade máxima',
    description: 'Complete 3 tarefas hoje',
    xp_reward: 40,
    minPlan: 'pro',
    trigger: 'task_completed',
    countNeeded: 3,
  },
  {
    type: 'checkins_2',
    title: 'Duplo check-in',
    description: 'Faça 2 check-ins hoje',
    xp_reward: 25,
    minPlan: 'pro',
    trigger: 'checkin_saved',
    countNeeded: 2,
  },
  {
    type: 'transactions_3',
    title: 'Mestre financeiro',
    description: 'Registre 3 transações hoje',
    xp_reward: 30,
    minPlan: 'pro',
    trigger: 'transaction_added',
    countNeeded: 3,
  },
]

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export async function checkAndGenerateMissions(
  userId: string,
  plan: string
): Promise<DailyMission[]> {
  const supabase = createClientSupabase()
  const today = getTodayStr()

  const { data: existing, error: selectError } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .order('created_at', { ascending: true })

  if (selectError) console.error('[missions] select error:', selectError)
  if (existing && existing.length > 0) return existing as DailyMission[]

  const defs = MISSION_DEFS.filter(d => planAllowed(plan, d.minPlan))
  const rows = defs.map(d => ({
    user_id: userId,
    date: today,
    mission_type: d.type,
    title: d.title,
    description: d.description,
    xp_reward: d.xp_reward,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('daily_missions')
    .insert(rows)
    .select()
    .order('created_at', { ascending: true })

  if (insertError) console.error('[missions] insert error:', insertError)
  return (inserted ?? []) as DailyMission[]
}

export async function checkMissionCompletion(
  userId: string,
  trigger: MissionTrigger
): Promise<MissionResult[]> {
  const supabase = createClientSupabase()
  const today = getTodayStr()

  const triggerTypes = MISSION_DEFS.filter(d => d.trigger === trigger).map(d => d.type)
  if (triggerTypes.length === 0) return []

  const { data: missions } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('is_completed', false)
    .in('mission_type', triggerTypes)

  if (!missions || missions.length === 0) return []

  const needsTaskCount    = missions.some(m => m.mission_type === 'tasks_completed_3')
  const needsCheckinCount = missions.some(m => m.mission_type === 'checkins_2')
  const needsTxCount      = missions.some(m => m.mission_type === 'transactions_3')

  const todayStart = `${today}T00:00:00.000Z`

  const [taskCount, checkinCount, txCount] = await Promise.all([
    needsTaskCount
      ? supabase.from('tasks').select('id', { count: 'exact', head: true })
          .eq('user_id', userId).eq('is_completed', true).gte('completed_at', todayStart)
          .then(r => r.count ?? 0)
      : Promise.resolve(0),
    needsCheckinCount
      ? supabase.from('mood_checkins').select('id', { count: 'exact', head: true })
          .eq('user_id', userId).eq('date', today)
          .then(r => r.count ?? 0)
      : Promise.resolve(0),
    needsTxCount
      ? supabase.from('financial_transactions').select('id', { count: 'exact', head: true })
          .eq('user_id', userId).gte('created_at', todayStart)
          .then(r => r.count ?? 0)
      : Promise.resolve(0),
  ])

  const results: MissionResult[] = []

  for (const mission of missions as DailyMission[]) {
    const def = MISSION_DEFS.find(d => d.type === mission.mission_type)
    if (!def) continue

    let conditionMet = true
    if (def.countNeeded) {
      let count = 0
      if (def.type === 'tasks_completed_3') count = taskCount
      else if (def.type === 'checkins_2')   count = checkinCount
      else if (def.type === 'transactions_3') count = txCount
      conditionMet = count >= def.countNeeded
    }
    if (!conditionMet) continue

    const { error } = await supabase
      .from('daily_missions')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', mission.id)

    if (error) continue

    const { data: prof } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single()

    if (prof) {
      const newXp = (prof.xp as number) + mission.xp_reward
      await supabase
        .from('profiles')
        .update({ xp: newXp, level: getLevelFromXP(newXp) })
        .eq('id', userId)
    }

    results.push({ missionId: mission.id, title: mission.title, xpAwarded: mission.xp_reward })
  }

  return results
}
