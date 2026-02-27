import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { processAllParameters } from '../../dynamic/healthEngine';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const result = processAllParameters(data);

        // Add entries to MongoDB
        const client = await clientPromise;
        const db = client.db('dhanvantari');
        const collection = db.collection('dynamic_data');

        const document = {
            ...result,
            rawData: data,
            createdAt: new Date(),
        };

        await collection.insertOne(document);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('dhanvantari');
        const collection = db.collection('dynamic_data');

        // Fetch ALL stored entries
        const allEntries = await collection.find({}).sort({ createdAt: 1 }).toArray();

        if (allEntries.length === 0) {
            return NextResponse.json({ error: 'No data found in dynamic_data' }, { status: 404 });
        }

        // Merge rawData from every entry: concatenate arrays per parameter
        const mergedData: Record<string, number[]> = {};
        for (const entry of allEntries) {
            if (!entry.rawData) continue;
            for (const [param, values] of Object.entries(entry.rawData)) {
                if (!Array.isArray(values)) continue;
                if (!mergedData[param]) mergedData[param] = [];
                mergedData[param].push(...(values as number[]));
            }
        }

        if (Object.keys(mergedData).length === 0) {
            return NextResponse.json({ error: 'No raw data found across entries' }, { status: 404 });
        }

        // Re-run full analysis on the combined dataset from all entries
        const result = processAllParameters(mergedData);

        return NextResponse.json({
            ...result,
            entriesAnalyzed: allEntries.length,
        });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
