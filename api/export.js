import { Redis } from '@upstash/redis'

// Initialize Redis from environment variables automatically injected by Vercel
const redis = Redis.fromEnv()

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const secretKey = process.env.EXPORT_SECRET_KEY || 'focus2026';
    const providedKey = req.query.key;

    if (providedKey !== secretKey) {
        return res.status(403).send('Forbidden: Invalid Key');
    }

    try {
        // Retrieve the last 100 evaluations
        const evaluations = await redis.lrange('evaluations', 0, 99);

        if (!evaluations || evaluations.length === 0) {
            return res.status(200).send('Date,Brief,Advisor Role,Advisor Name,Report\nNo records found,,,,');
        }

        // CSV Header
        let csv = 'Date,Brief,Advisor Role,Advisor Name,Report\n';

        // Prepare rows (escape quotes and commas for CSV compatibility)
        for (const evalEntry of evaluations) {
            const date = new Date(evalEntry.timestamp || Date.now()).toLocaleString('uk-UA').replace(/,/g, '');

            // Clean up text replacing newlines and quotes
            const escapeCSV = (str) => {
                if (!str) return '';
                let result = String(str).replace(/"/g, '""'); // Double up quotes
                // Wrap in quotes if it contains commas, newlines, or quotes
                if (result.search(/("|,|\n|\r)/g) >= 0) {
                    result = `"${result}"`;
                }
                return result;
            };

            const brief = escapeCSV(evalEntry.brief);
            const role = escapeCSV(evalEntry.advisorRole);
            const name = escapeCSV(evalEntry.advisorName);
            const report = escapeCSV(evalEntry.report);

            csv += `${date},${brief},${role},${name},${report}\n`;
        }

        // Mirror the exact cache headers from the user's previous working Vercel app
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(csv);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).send(`Error retrieving data: ${error.message || error}`);
    }
}
