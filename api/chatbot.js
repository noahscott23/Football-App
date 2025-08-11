import { getLocalResponse } from '../../../src/chatLogic.js'; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await getLocalResponse(message);

    return res.status(200).json({
      reply: response,
      success: true
    });
  } catch (err) {
    console.error('Error generating response:', err.message);

    return res.status(500).json({
      reply: "Sorry, I'm having trouble processing your request right now. Try asking about player recommendations, comparisons, or fantasy advice!",
      success: false,
      error: 'Local response generation failed'
    });
  }
}
