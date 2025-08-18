import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;
    const contextStr = formData.get('context') as string;
    
    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    
    // Parse context if available
    const context = contextStr ? JSON.parse(contextStr) : {};
    
    // Prepare the request to Gemini API
    const apiKey = process.env.GEMINI_API_KEY || ''; // Set this in your .env file
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Enhanced prompt with canvas context
    const enhancedPrompt = `
      You are an expert canvas analysis AI. Analyze this whiteboard/canvas image and provide insights about the visual content, ideas, and collaboration patterns.
      
      Canvas Context:
      - Total drawn elements: ${context.total_elements || 'unknown'}
      - Sticky notes: ${context.sticky_notes_count || 'unknown'}
      - Element types: ${JSON.stringify(context.element_types || {})}
      - Sample sticky note content: ${JSON.stringify(context.sticky_notes_content || [])}
      
      User query: ${prompt}
      
      Provide a comprehensive analysis including:
      1. Overall summary of what's depicted
      2. Key insights and patterns
      3. Suggestions for improvement or next steps
      4. Detected elements breakdown
      
      Be concise but thorough. Focus on actionable insights.
    `;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: enhancedPrompt },
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to process with Gemini API' },
        { status: response.status }
      );
    }

    // Extract the response text
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis available';
    
    return NextResponse.json({ text: result });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}