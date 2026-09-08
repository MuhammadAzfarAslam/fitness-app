import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
export async function authorize(req: Request) {
  if (req.method !== 'POST') throw new Error('Method not allowed');
  const origin = req.headers.get('origin');
  const allowed = Deno.env.get('ALLOWED_ORIGIN');
  if (allowed && origin && origin !== allowed) throw new Error('Origin not allowed');
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('Authentication required');
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getUser(authorization.slice(7));
  if (error || !data.user) throw new Error('Authentication required');
  const { data: allowedQuota, error: quotaError } = await client.rpc('consume_ai_quota');
  if (quotaError || !allowedQuota)
    throw new Error('Daily AI allowance reached. Try again tomorrow.');
  return client;
}
export async function completion(messages: unknown[], jsonMode = false) {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('AI service is not configured');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini',
      messages,
      max_completion_tokens: 700,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error('AI service is temporarily unavailable');
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('AI service returned an empty response');
  return content;
}
export function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Request failed';
  const status =
    message === 'Authentication required'
      ? 401
      : message.includes('allowance')
        ? 429
        : message.includes('configured')
          ? 503
          : 400;
  return json({ error: message }, status);
}
