export async function POST(req: Request) {
  try {
    const payload = await req.json()
    console.log('🧭 Chart plan (server log):', JSON.stringify(payload, null, 2))
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Failed to log chart plan:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
