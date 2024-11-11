import fetch from 'node-fetch';
import fs from 'fs/promises';
import agents from './agents.js';

const OLLAMA_API = 'http://localhost:11434/api/generate';
const DB_FILE = 'society_memory.json';

// Simple database operations
async function loadDatabase() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return initial database structure
        return {
            memories: [],
            societyState: {
                resources: {},
                developments: [],
                conversations: []
            }
        };
    }
}

async function saveToDatabase(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Function to communicate with Ollama
async function askOllama(model, prompt) {
    try {
        const response = await fetch(OLLAMA_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false
            })
        });
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Ollama API Error:', error);
        return null;
    }
}

// Function to generate context for each agent including their memories
function generateAgentContext(agent, db) {
    // Get last 5 memories related to this agent
    const agentMemories = db.memories
        .filter(m => m.agentName === agent.name)
        .slice(-5)
        .map(m => m.content)
        .join('\n');

    return `You are ${agent.name}, ${agent.role} in this society. 
    Your personality: ${agent.personality}
    
    Your recent memories:
    ${agentMemories}
    
    Current society state: ${JSON.stringify(db.societyState)}
    
    What are your thoughts or actions based on your personality and memories?`;
}

// Main society simulation loop
async function runSociety() {
    console.log('Loading society database...');
    let db = await loadDatabase();
    
    console.log('Starting society simulation...');

    while (true) {
        for (const agent of agents) {
            // Generate context for the current agent
            const context = generateAgentContext(agent, db);
            
            // Get agent's response through Ollama
            console.log(`\n${agent.name} (${agent.role}) is thinking...`);
            const response = await askOllama('llama3.2:1b', context);
            
            if (response) {
                console.log(`${agent.name}: ${response}`);
                
                // Create new memory
                const memory = {
                    agentName: agent.name,
                    role: agent.role,
                    content: response,
                    timestamp: new Date().toISOString()
                };

                // Update database
                db.memories.push(memory);
                db.societyState.conversations.push({
                    agent: agent.name,
                    thought: response,
                    timestamp: new Date().toISOString()
                });

                // Save after each agent's action
                await saveToDatabase(db);
            }
        }

        // Add a small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Basic memory management - keep last 1000 memories
        if (db.memories.length > 1000) {
            db.memories = db.memories.slice(-1000);
            await saveToDatabase(db);
        }
    }
}

// Simple analysis functions
export async function analyzeAgent(agentName) {
    const db = await loadDatabase();
    const agentMemories = db.memories.filter(m => m.agentName === agentName);
    return {
        totalInteractions: agentMemories.length,
        memories: agentMemories
    };
}

export async function analyzeSociety() {
    const db = await loadDatabase();
    return {
        totalMemories: db.memories.length,
        agentStats: agents.map(agent => ({
            name: agent.name,
            totalInteractions: db.memories.filter(m => m.agentName === agent.name).length
        })),
        societyState: db.societyState
    };
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the society
console.log('Initializing OllamaSociety...');
runSociety().catch(console.error);
