import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';

export async function POST(request) {
  try {
    const { text, lang = 'en' } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // googleTTS.getAllAudioBase64 chunks the text and returns an array of base64 strings
    const audioData = await googleTTS.getAllAudioBase64(text, {
      lang: lang,
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
      splitPunct: ',.?',
    });

    // We can return the array of base64 chunks to the client, and the client can combine them
    return NextResponse.json({ audioChunks: audioData });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
  }
}
