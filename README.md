# OllamaSociety- 🤖🌍

A Node.js experiment where 10 AI agents with distinct personalities form an emergent society using locally-run Ollama LLMs. Each agent (thinker, inventor, artist, etc.) has their own memory and interacts freely with others, creating an organic, evolving social simulation.

Features:
- 10 unique AI personalities running on local LLMs
- Simple JSON-based memory system
- No predetermined rules - true emergent behavior
- Minimal 3-file structure for easy modification
- Built with Node.js + Ollama

## Quick Start
```bash
npm init -y
ollama run llama3.2:1b
node index.js
```

you can use different model by changing llama3.2:1b to your model name, here in index.js

```
// Get agent's response through Ollama
            console.log(`\n${agent.name} (${agent.role}) is thinking...`);
            const response = await askOllama('llama3.2:1b', context);
```
           
