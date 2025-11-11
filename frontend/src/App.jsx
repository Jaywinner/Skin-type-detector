import React, { useState, useEffect, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'

const TFJS_MODEL_PATH = '/tm-my-image-model/model.json'

const TIPS = {
  Normal: 'Maintain a simple, consistent routine.',
  Dry: 'Use hydrating serums and rich moisturizers twice daily.',
  Oily: 'Use gentle foaming cleansers; avoid heavy creams.',
  Combination: 'Balance oily T-zone with light moisturizers.'
}

export default function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [tfModel, setTfModel] = useState(null)
  const [tfLabels, setTfLabels] = useState(null)
  const [imageSize, setImageSize] = useState(224)
  const [modelLoading, setModelLoading] = useState(false)
  const canvasRef = useRef(null)
  const [showConsent, setShowConsent] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)

  function onFileChange(e) {
    const f = e.target.files && e.target.files[0]
    setError(null)
    setResult(null)
    if (!f) {
      setFile(null)
      setPreview(null)
      return
    }
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  useEffect(() => {
    let mounted = true
    async function loadModel() {
      setModelLoading(true)
      try {
        const model = await tf.loadLayersModel(TFJS_MODEL_PATH)
        try {
          const res = await fetch('/tm-my-image-model/metadata.json')
          const meta = await res.json()
          const labels = meta.labels || (meta.metadata && meta.metadata.labels) || null
          const size = meta.imageSize || meta.inputShape || 224
          if (mounted) setTfLabels(labels)
          if (mounted) setImageSize(size)
        } catch (e) {}
        if (mounted) setTfModel(model)
      } catch (e) {
        console.warn('Failed to load TFJS model', e)
        if (mounted) {
          setError(String(e))
          setStatus('error')
        }
      } finally {
        if (mounted) setModelLoading(false)
      }
    }
    loadModel()
    const stored = localStorage.getItem('skin_consent')
    if (stored === 'true') setConsentGiven(true)
    return () => { mounted = false }
  }, [])

  async function predictWithTfjs(file) {
    if (!tfModel) {
      setError('Local TFJS model not loaded')
      setStatus('error')
      return
    }
    setStatus('sending')
    setError(null)
    setResult(null)
    try {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = url
      })

      let canvas = canvasRef.current
      if (!canvas) canvas = document.createElement('canvas')

      const size = imageSize || 224
      const targetH = size
      const targetW = size

      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, targetW, targetH)

      let t = tf.browser.fromPixels(canvas).toFloat().div(255.0)
      if (t.shape.length === 3) t = t.expandDims(0)

      const preds = await tfModel.predict(t)
      let probs = preds
      if (Array.isArray(preds)) probs = preds[0]
      const data = await probs.data()
      let bestIdx = 0
      let bestVal = data[0]
      for (let i = 1; i < data.length; i++) {
        if (data[i] > bestVal) {
          bestVal = data[i]
          bestIdx = i
        }
      }
      const label = (tfLabels && tfLabels[bestIdx]) || String(bestIdx)
      const tip = TIPS[label] || 'Maintain balanced hydration and consult a professional for concerns.'
      setResult({ type: label, confidence: Number(bestVal), raw: Array.from(data), tip })
      setStatus('done')
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('TFJS predict failed', e)
      setError(String(e))
      setStatus('error')
    }
  }

  function handleAnalyzeClick() {
    if (!consentGiven) {
      setShowConsent(true)
      return
    }
    predictWithTfjs(file)
  }

  function acceptConsent(doNotShowAgain) {
    setConsentGiven(true)
    setShowConsent(false)
    if (doNotShowAgain) localStorage.setItem('skin_consent', 'true')
    predictWithTfjs(file)
  }

  return (
    <div className="app-root">
      <div className="container card">
        <header className="header">
          <h1>Skin Awareness — Quick Check</h1>
          <p className="subtitle">Upload a clear face photo. This tool runs a local model for awareness, not diagnosis.</p>
        </header>

        <div className="uploader">
          <label className="dropzone" htmlFor="file-input">
            <input id="file-input" type="file" accept="image/*" onChange={onFileChange} />
            <div className="drop-inner">
              <div className="icon">📷</div>
              <div className="text">Drop or click to choose an image</div>
              <div className="hint">Try a close-up of your face (no ID needed)</div>
            </div>
          </label>

          <div className="preview-area">
            {preview ? (
              <div className={`preview animated ${status === 'sending' ? 'pulse' : ''}`}>
                <img src={preview} alt="preview" />
              </div>
            ) : (
              <div className="preview empty">No image selected</div>
            )}
          </div>
        </div>

        <div className="actions">
          <button className="primary" onClick={handleAnalyzeClick} disabled={!file || modelLoading || status === 'sending'}>
            {modelLoading ? 'Loading model...' : status === 'sending' ? 'Analyzing...' : 'Analyze skin'}
          </button>
        </div>

        {status === 'done' && result && (
          <div className="result card result-anim">
            <h2>Analysis</h2>
            <p className="result-line"><strong>Skin Type:</strong> {result.type} <span className="confidence">(Confidence: {Math.round(result.confidence * 100)}%)</span></p>
            <p className="result-line"><strong>Recommendation:</strong> {result.tip}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="error card">
            <h3>Something went wrong</h3>
            <pre>{error}</pre>
          </div>
        )}

        <div className="ethics card">
          <h3>Important — Not medical advice</h3>
          <p>This tool is provided for awareness only. It uses a locally-run machine learning model to offer general recommendations. It is not a diagnosis. For skin concerns or medical issues, please consult a qualified healthcare professional.</p>
        </div>
        {showConsent && (
          <div className="modal-backdrop">
            <div className="modal card">
              <h3>Before you proceed</h3>
              <p>This tool analyzes images locally for general skin-type awareness only. It is NOT a medical diagnosis. Do you consent to proceed?</p>
              <div className="modal-actions">
                <label><input type="checkbox" id="dontshow" /> Don't show this again</label>
                <div>
                  <button className="btn-muted" onClick={() => setShowConsent(false)}>Cancel</button>
                  <button className="primary" onClick={() => {
                    const cb = document.getElementById('dontshow')
                    acceptConsent(cb && cb.checked)
                  }}>I consent</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
