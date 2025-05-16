const express = require('express');
const app = express();
app.use(express.json());
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/message', async (req, res) => {
  const userMessage = req.body.message;

  const systemPrompt = `
You are a compassionate, supportive, and empathetic therapist chatbot named MindNest.
Your job is to listen, validate feelings, and gently guide users toward positive mental health strategies.
Always reply in a warm, human, and conversational tone.
If the user is sad, anxious, or stressed, offer comfort and gentle suggestions.
If the user asks for exercises, suggest simple mindfulness, breathing, or journaling activities.
Keep your responses supportive and never judgmental.
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent([
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: userMessage }] }
    ]);
    const botReply = result.response.text();
    res.json({ reply: botReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get response from Gemini API' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});