import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SuggestRequest {
  plan_id: string
  year: number
  week_number: number
  preferences?: {
    dietary?: string[]
    max_cook_time_minutes?: number
    servings?: number
  }
  context?: {
    use_existing_recipes?: boolean
    avoid_repeat_days?: number
  }
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

    const body = await req.json() as SuggestRequest
    const { plan_id, year, week_number, preferences = {}, context = {} } = body

    // Verify membership
    const { data: membership } = await supabase
      .from('plan_members')
      .select('id')
      .eq('plan_id', plan_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Gather historical data for context
    const { data: existingRecipes } = await supabase
      .from('recipes')
      .select('id, title, kind')
      .eq('plan_id', plan_id)
      .limit(50)

    const { data: recentMeals } = await supabase
      .from('meals')
      .select('title, day_of_week, weeks(year, week_number)')
      .eq('plan_id', plan_id)
      .order('created_at', { ascending: false })
      .limit(30)

    // Build prompt for Claude API
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      // Return a stub response if no API key configured
      return new Response(JSON.stringify({
        suggestions: buildStubSuggestions(),
        meta: {
          model: 'stub',
          generated_at: new Date().toISOString(),
          note: 'Configure ANTHROPIC_API_KEY in Edge Function secrets to enable AI suggestions',
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = `You are a helpful meal planning assistant. Suggest 7 meals for a week (Monday to Sunday).
Return a JSON object with a "suggestions" array. Each suggestion has:
- day_of_week: integer 1-7 (1=Monday)
- title: string
- recipes: array of objects, each with either "existing_recipe_id" (uuid) or "new_recipe" object
- comment: null or string

Keep suggestions varied, practical, and aligned with the user's dietary preferences.`

    const userMessage = `Plan a week of meals for week ${week_number} of ${year}.
Dietary preferences: ${preferences.dietary?.join(', ') || 'none specified'}
Max cook time: ${preferences.max_cook_time_minutes ? `${preferences.max_cook_time_minutes} minutes` : 'not specified'}
Servings: ${preferences.servings || 'not specified'}

Available existing recipes: ${JSON.stringify(existingRecipes?.map(r => ({ id: r.id, title: r.title })) || [])}
Recent meal history: ${JSON.stringify(recentMeals?.map(m => ({ title: m.title, day: m.day_of_week })) || [])}

${context.use_existing_recipes ? 'Prefer using existing recipes where possible.' : ''}
${context.avoid_repeat_days ? `Avoid repeating meals from the last ${context.avoid_repeat_days} days.` : ''}`

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    const claudeData = await claudeResponse.json()
    const content = claudeData.content?.[0]?.text || '{}'

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      // Try to extract JSON from markdown code blocks
      const match = content.match(/```json\n?([\s\S]*?)\n?```/)
      parsed = match ? JSON.parse(match[1]) : { suggestions: buildStubSuggestions() }
    }

    return new Response(JSON.stringify({
      ...parsed,
      meta: {
        model: 'claude-sonnet-4-6',
        generated_at: new Date().toISOString(),
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildStubSuggestions() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const meals = [
    'Pasta Bolognese', 'Grilled Chicken Salad', 'Vegetable Stir-fry',
    'Beef Tacos', 'Salmon with Roasted Vegetables', 'Mushroom Risotto', 'Weekend BBQ',
  ]
  return days.map((_, i) => ({
    day_of_week: i + 1,
    title: meals[i],
    recipes: [{ new_recipe: { title: meals[i], kind: 'text', content: null } }],
    comment: null,
  }))
}
