import { Redis } from '@upstash/redis'

// Initialize Redis from environment variables automatically injected by Vercel
const redis = Redis.fromEnv()

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const data = req.body;

        // Basic validation
        if (!data || !data.brief || !data.report) {
            return res.status(400).json({ error: 'Missing required data fields' });
        }

        const timestamp = new Date().toISOString();
        const entryId = `eval_${Date.now()}`;

        // Store the evaluation data
        const entry = {
            id: entryId,
            timestamp: timestamp,
            brief: data.brief,
            advisorName: data.advisorName || 'Unknown',
            advisorRole: data.advisorRole || 'Unknown',
            report: data.report
        };

        // Add to a list of all evaluations using Upstash Redis lpush
        await redis.lpush('evaluations', entry);

        return res.status(200).json({ success: true, id: entryId });
    } catch (error) {
        console.error('Error saving to Upstash Redis:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
