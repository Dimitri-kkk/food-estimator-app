import { NextResponse } from 'next/server'

export const runtime = 'edge'  // optional, for faster API

export async function POST(request: Request) {
  try {
    // Read the image bytes from the request body
    const imageBuffer = await request.arrayBuffer()

    // Call Hugging Face API with the image bytes
    const response = await fetch(
      'https://api-inference.huggingface.co/models/ashaduzzaman/vit-finetuned-food101',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const predictions = await response.json()

    // Extract top prediction
    const topPrediction = predictions[0]

    // Simple mapping: map food label to estimated calories/protein (example values)
    const nutritionMap: Record<string, { calories: number; protein: number }> = {
      pizza: { calories: 266, protein: 11 },
      cheeseburger: { calories: 303, protein: 17 },
      sushi: { calories: 200, protein: 8 },
      apple: { calories: 52, protein: 0.3 },
      banana: { calories: 89, protein: 1.1 },
      // Add more mappings as you want
    }

    const foodLabel = topPrediction?.label?.toLowerCase() || 'unknown'
    const nutrition = nutritionMap[foodLabel] || { calories: 0, protein: 0 }

    return NextResponse.json({
      food: topPrediction.label,
      score: topPrediction.score,
      calories: nutrition.calories,
      protein: nutrition.protein,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
