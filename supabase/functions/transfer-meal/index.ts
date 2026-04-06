import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Get the requesting user from JWT
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { meal_id, direction } = await req.json() as {
      meal_id: string
      direction: 'prev' | 'next'
    }

    if (!meal_id || !['prev', 'next'].includes(direction)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch the meal with its current week
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .select('*, weeks(*)')
      .eq('id', meal_id)
      .single()

    if (mealError || !meal) {
      return new Response(JSON.stringify({ error: 'Meal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user is a plan member
    const { data: membership } = await supabase
      .from('plan_members')
      .select('id')
      .eq('plan_id', meal.plan_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const week = meal.weeks
    const targetDate = getAdjacentWeekDate(week.year, week.week_number, direction)

    // Find or create the target week
    let targetWeekId: string
    const { data: existingWeek } = await supabase
      .from('weeks')
      .select('id')
      .eq('plan_id', meal.plan_id)
      .eq('year', targetDate.year)
      .eq('week_number', targetDate.weekNumber)
      .single()

    if (existingWeek) {
      targetWeekId = existingWeek.id
    } else {
      const { data: newWeek, error: weekError } = await supabase
        .from('weeks')
        .insert({
          plan_id: meal.plan_id,
          year: targetDate.year,
          week_number: targetDate.weekNumber,
        })
        .select('id')
        .single()

      if (weekError || !newWeek) {
        return new Response(JSON.stringify({ error: 'Failed to create target week' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      targetWeekId = newWeek.id
    }

    // Move the meal
    const { data: updatedMeal, error: updateError } = await supabase
      .from('meals')
      .update({ week_id: targetWeekId })
      .eq('id', meal_id)
      .select()
      .single()

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to transfer meal' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ meal: updatedMeal, week_id: targetWeekId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function getAdjacentWeekDate(year: number, weekNumber: number, direction: 'prev' | 'next') {
  const delta = direction === 'next' ? 1 : -1
  let targetWeek = weekNumber + delta
  let targetYear = year

  if (targetWeek < 1) {
    targetYear -= 1
    targetWeek = getISOWeeksInYear(targetYear)
  } else if (targetWeek > getISOWeeksInYear(year)) {
    targetYear += 1
    targetWeek = 1
  }

  return { year: targetYear, weekNumber: targetWeek }
}

function getISOWeeksInYear(year: number): number {
  // A year has 53 ISO weeks if Jan 1 or Dec 31 is a Thursday
  const jan1 = new Date(year, 0, 1).getDay()
  const dec31 = new Date(year, 11, 31).getDay()
  return jan1 === 4 || dec31 === 4 ? 53 : 52
}
