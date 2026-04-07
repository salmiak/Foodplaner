import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth.store'
import type { Plan, PlanMember } from '@/types/app.types'

export const usePlanStore = defineStore('plan', () => {
  const currentPlan = ref<Plan | null>(null)
  const members = ref<PlanMember[]>([])
  const userPlans = ref<Plan[]>([])
  const loading = ref(false)

  async function fetchUserPlans() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('plan_members')
        .select('plans(*)')
        .order('joined_at', { ascending: true })

      if (error) throw error

      userPlans.value = (data ?? [])
        .map((row: { plans: Plan | Plan[] }) => Array.isArray(row.plans) ? row.plans[0] : row.plans)
        .filter(Boolean) as Plan[]
    } finally {
      loading.value = false
    }
  }

  async function fetchPlan(planId: string) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (error) throw error
    currentPlan.value = data
  }

  async function fetchMembers(planId: string) {
    const { data, error } = await supabase
      .from('plan_members')
      .select('*')
      .eq('plan_id', planId)

    if (error) throw error
    members.value = data ?? []
  }

  async function createPlan(name: string): Promise<Plan> {
    const authStore = useAuthStore()
    if (!authStore.userId) throw new Error('Not authenticated')

    // Generate ID client-side so we can insert into plan_members before fetching
    // (avoids RLS chicken-and-egg: SELECT policy requires being a member)
    const planId = crypto.randomUUID()

    const { error: planError } = await supabase
      .from('plans')
      .insert({ id: planId, name })

    if (planError) throw planError

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('plan_members')
      .insert({
        plan_id: planId,
        user_id: authStore.userId,
        role: 'owner',
      })

    if (memberError) throw memberError

    // Now fetch the plan (SELECT policy passes because user is now a member)
    const { data: plan, error: fetchError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (fetchError) throw fetchError

    currentPlan.value = plan
    userPlans.value.push(plan)
    return plan
  }

  async function inviteMember(planId: string, email: string) {
    // Look up the user by email via a custom RPC or just insert by looking up auth
    // For now, we insert and let the user claim on login
    const { data: targetUser } = await supabase
      .rpc('get_user_id_by_email', { p_email: email })

    if (!targetUser) {
      throw new Error('No user found with that email. They must sign up first.')
    }

    const { error } = await supabase
      .from('plan_members')
      .insert({ plan_id: planId, user_id: targetUser, role: 'member' })

    if (error) throw error
    await fetchMembers(planId)
  }

  async function removeMember(planId: string, userId: string) {
    const { error } = await supabase
      .from('plan_members')
      .delete()
      .eq('plan_id', planId)
      .eq('user_id', userId)

    if (error) throw error
    members.value = members.value.filter((m) => m.user_id !== userId)
  }

  return {
    currentPlan,
    members,
    userPlans,
    loading,
    fetchUserPlans,
    fetchPlan,
    fetchMembers,
    createPlan,
    inviteMember,
    removeMember,
  }
})
