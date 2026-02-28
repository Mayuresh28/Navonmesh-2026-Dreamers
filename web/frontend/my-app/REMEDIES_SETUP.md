# Remedies Feature Setup

## Overview
The Remedies page uses Groq's ultra-fast LLM API to provide comprehensive treatment and management strategies for various health conditions, combining modern medicine, traditional remedies, and alternative therapies.

## Setup Instructions

### 1. Get Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or sign in with your account
3. Navigate to API Keys section
4. Click "Create API Key"
5. Copy the generated API key (starts with `gsk_`)

### 2. Configure Environment Variable
1. Create a `.env.local` file in the `my-app` directory (if it doesn't exist)
2. Add the following line:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with the API key you copied

### 3. Restart Development Server
```bash
npm run dev
```

## Features
- **Search**: Enter any disease or health condition
- **Quick Select**: Choose from common conditions
- **AI-Powered**: Gemini generates comprehensive treatment plans including:
  - Modern medical treatments and medications
  - Ayurvedic & traditional remedies
  - Lifestyle modifications
  - Dietary recommendations with nutritional science
  - Physical exercises, yoga, and breathing techniques
  - Alternative therapies (acupuncture, homeopathy, naturopathy)
  - Prevention and long-term management strategies

## Usage
1. Navigate to the "Remedies" tab in the bottom navigation
2. Enter a disease name or select from quick options
3. Click "Search" to get personalized remedies
4. Read through the comprehensive recommendations

## API Details
- **Model**: Llama 3.3 70B Versatile
- **Provider**: Groq (ultra-fast inference)
- **Endpoint**: Groq Cloud API (OpenAI-compatible)
- **Cost**: Free tier available with generous limits
- **Speed**: Up to 800+ tokens/second
- **Rate Limits**: Check [Groq Documentation](https://console.groq.com/docs/rate-limits)

## Notes
- The API key should never be committed to version control
- `.env.local` is already in `.gitignore`
- Always consult healthcare professionals for medical advice
