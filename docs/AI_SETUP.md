# AI Features Setup Guide

## 🎯 Overview

Your scrapbook app now includes AI-powered text polishing! The "Polish Text" button uses Google's Gemini AI to:
- ✅ Fix grammar and spelling errors
- ✅ Improve clarity and flow
- ✅ Maintain the original tone and meaning
- ✅ Preserve emojis and personal voice

## 📝 Quick Setup (5 minutes)

### Step 1: Get Your Free Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Click **"Create API Key in New Project"** (or select existing project)
5. Copy the API key (starts with `AIza...`)

### Step 2: Add API Key to Your Project

1. Open `.env.local` file in your project root
2. Replace `your_gemini_api_key_here` with your actual API key:

```env
VITE_GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

3. Save the file

### Step 3: Restart Your Dev Server

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## ✅ That's It!

You should now see a **"✨ Polish Text"** button in the text editor. Try it out!

---

## 💰 Pricing

### Free Tier (Recommended for Start)
- **Cost**: $0/month
- **Limits**:
  - 15 requests per minute
  - 1,500 requests per day
  - 1 million tokens per month
- **Perfect for**: Testing and moderate use

### Paid Tier (Optional)
Only needed if you exceed free tier limits.

**Gemini 2.0 Flash Pricing** (per 1 million tokens):
- Input: $0.10
- Output: $0.40

**Typical Costs**:
- Polish 100-word text: ~$0.00005-$0.0001 per request
- 100 AI polishes/month: **~$0.01-$0.02/month**
- 1,000 AI polishes/month: **~$0.10-$0.20/month**

💡 **Note**: ~4 characters = 1 token

---

## 🔧 Technical Details

### Model Used
- **Model**: `gemini-2.0-flash-exp`
- **Why**: Fast, cost-effective, and excellent for text editing
- **Alternative**: Can switch to `gemini-2.5-flash` for better quality (higher cost)

### Files Modified
1. **New**: `src/services/aiService.js` - AI service wrapper
2. **Modified**: `src/components/RichTextEditor.jsx` - Added Polish button
3. **Modified**: `.env.local` - API key configuration

### How It Works
```javascript
// User clicks "Polish Text"
// ↓
// RichTextEditor extracts plain text
// ↓
// aiService.polishText(text) sends to Gemini
// ↓
// Gemini returns polished text
// ↓
// Editor updates with improved text
```

---

## 🚀 Future AI Features (Planned)

Based on the implementation plan, here's what can be added next:

### Phase 1: Additional Text Features
- **Expand Text**: "Continue writing..." button
- **Change Tone**: Switch between romantic, playful, poetic
- **Shorten/Lengthen**: Adjust text length

### Phase 2: Image Features
- **AI Captions**: Generate romantic captions for photos
- **Image Descriptions**: Auto alt-text for accessibility

### Phase 3: Timeline Features
- **Event Suggestions**: AI suggests milestone events
- **Event Descriptions**: Auto-complete event details

### Phase 4: Advanced Features
- **Theme Detection**: Analyze scrapbook mood and suggest colors
- **Memory Prompts**: Questions to spark memories
- **Layout Suggestions**: AI-powered design recommendations

---

## 🔒 Security Notes

### API Key Security
- ✅ API key is stored in `.env.local` (not committed to git)
- ✅ Frontend-only usage (safe for client apps on Blaze plan)
- ⚠️ **Important**: Add `.env.local` to `.gitignore`

### Rate Limiting
The free tier has generous limits:
- 15 requests/minute = ~900 polishes/hour
- 1,500 requests/day = plenty for normal use

### Cost Protection
To prevent unexpected costs:
1. Start with free tier
2. Monitor usage in [Google AI Studio](https://aistudio.google.com/)
3. Set up budget alerts in Google Cloud Console (optional)

---

## 🐛 Troubleshooting

### "Failed to polish text" Error

**Possible causes**:
1. **No API key set**
   - Check `.env.local` has valid `VITE_GEMINI_API_KEY`
   - Restart dev server after adding key

2. **Invalid API key**
   - Verify key copied correctly from AI Studio
   - Make sure key starts with `AIza`

3. **Rate limit exceeded**
   - Free tier: 15 requests/minute
   - Wait a minute and try again

4. **Network issues**
   - Check internet connection
   - Check browser console for errors

### Button Not Appearing

1. **Clear browser cache**
   ```bash
   # In browser: Ctrl+Shift+R (hard refresh)
   ```

2. **Rebuild the app**
   ```bash
   npm run build
   ```

3. **Check console for errors**
   - Open browser DevTools (F12)
   - Look for red errors in Console tab

---

## 📊 Monitoring Usage

### Check Your Usage

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click on your project
3. View usage statistics

### Monitor Costs (Paid Tier Only)

If you upgrade to paid tier:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **Billing** → **Reports**
4. Filter by **Vertex AI** or **Generative AI**

---

## 💡 Tips for Best Results

### Writing Tips
- Write naturally first, then polish
- Polish button works best with 50-500 words
- Can polish multiple times if needed
- Preserves your emojis and tone

### Cost Optimization
- Use free tier for development
- Only polish important sections
- Cache common polishes if implementing backend

### User Experience
- Show loading state (already implemented ✅)
- Handle errors gracefully (already implemented ✅)
- Allow users to undo (can be added)

---

## 🎓 Learn More

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firebase Vertex AI Guide](https://firebase.google.com/docs/vertex-ai)
- [Pricing Calculator](https://ai.google.dev/pricing)

---

## 📞 Support

If you run into issues:
1. Check this guide first
2. Look at browser console errors
3. Verify API key in `.env.local`
4. Restart dev server

---

## 🎉 Success!

Once set up, your users can:
1. Type text in any editor
2. Click "✨ Polish Text"
3. Get AI-improved text instantly!

**Estimated setup time**: 5 minutes
**Cost to start**: $0 (free tier)
**Value to users**: Priceless! ✨
