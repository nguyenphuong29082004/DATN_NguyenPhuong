import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendDiscordMessage(webhookUrl: string, content: string, embed?: any) {
    if (!webhookUrl) return;
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content,
                embeds: embed ? [embed] : []
            })
        });
    } catch (err) {
        console.error('Failed to send Discord message:', err);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL') || ''
        if (!discordWebhookUrl) {
            console.log("No DISCORD_WEBHOOK_URL set. Skipping notification.");
            return new Response('ok', { status: 200 })
        }

        const payload = await req.json()
        
        // Ensure this payload looks like a new user webhook payload (from auth.users or public.users)
        if (payload.type === 'INSERT' && payload.table === 'users' && payload.schema === 'public') {
            const { record } = payload;
            
            await sendDiscordMessage(discordWebhookUrl, `🎉 **New User Registered!**`, {
                title: 'Welcome to Catwalk Studio',
                description: `A new user has just joined the platform.`,
                color: 0x3498DB, // Blue
                fields: [
                    { name: 'User ID', value: record.user_id, inline: true },
                    { name: 'Email', value: record.email || 'N/A', inline: true },
                    { name: 'Type', value: record.user_type || 'user', inline: true }
                ],
                timestamp: new Date().toISOString()
            })
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        console.error('Error in notify-new-user:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
