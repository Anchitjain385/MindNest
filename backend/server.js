const express = require('express');
const app = express();
app.use(express.json());
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Init Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Therapist-style system prompt
const systemPrompt = `
You are a compassionate, supportive, and empathetic therapist chatbot named MindNest.
Your job is to listen, validate feelings, and gently guide users toward positive mental health strategies.
Always reply in a warm, human, and conversational tone.
If the user is sad, anxious, or stressed, offer comfort and gentle suggestions.
If the user asks for exercises, suggest simple mindfulness, breathing, or journaling activities.
Keep your responses supportive and never judgmental.
`;

// Store chat sessions (in-memory for now; use DB or Redis in production)
const chatSessions = {};

app.post('/message', async (req, res) => {
  const { message, userId = 'default' } = req.body; // use unique userId in production

  try {
    // Create chat session if it doesn't exist
    if (!chatSessions[userId]) {
      chatSessions[userId] = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: { temperature: 0.8 },
      });
    }

    const chat = chatSessions[userId];

    // Stream Gemini's response
    const stream = await chat.sendMessageStream(message);

    res.setHeader('Content-Type', 'text/plain');

    let botReply = '';

    for await (const chunk of stream.stream) {
      const text = chunk.text();
      botReply += text;
    }

    res.send(botReply);
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: 'Failed to get response from Gemini API' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
