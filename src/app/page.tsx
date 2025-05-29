'use client'

import React, { useState } from 'react'

export default function HomePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setResult(null)
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('image') as File

    if (!file) {
      setError('Please select an image.')
      setLoading(false)
      return
    }

    try {
      const arrayBuffer = await file.arrayBuffer()

      const response = await fetch(
        'https://api-inference.huggingface.co/models/google/vit-base-patch16-224',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_HUGGINGFACE_API_TOKEN}`,
            'Content-Type': 'application/octet-stream',
          },
          body: arrayBuffer,
        }
      )

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText)
      }

      const predictions = await response.json()

      // Map food label to nutrition info
      const nutritionMap: Record<string, { calories: number; protein: number }> = {
        pizza: { calories: 266, protein: 11 },
        cheeseburger: { calories: 303, protein: 17 },
        sushi: { calories: 200, protein: 8 },
        apple: { calories: 52, protein: 0.3 },
        banana: { calories: 89, protein: 1.1 },
      }

      const topPrediction = predictions[0]
      const foodLabel = topPrediction?.label?.toLowerCase() || 'unknown'
      const nutrition = nutritionMap[foodLabel] || { calories: 0, protein: 0 }

      setResult({
        food: topPrediction.label,
        score: topPrediction.score,
        calories: nutrition.calories,
        protein: nutrition.protein,
      })
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Food Calorie & Protein Estimator</h1>
      <form onSubmit={onSubmit}>
        <input type="file" name="image" accept="image/*" required />
        <button type="submit" disabled={loading} style={{ marginLeft: 10 }}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h2>Result</h2>
          <p>
            <strong>Food:</strong> {result.food} (confidence: {(result.score * 100).toFixed(2)}%)
          </p>
          <p>
            <strong>Estimated Calories:</strong> {result.calories} kcal
          </p>
          <p>
            <strong>Estimated Protein:</strong> {result.protein} g
          </p>
        </div>
      )}
    </main>
  )
}
