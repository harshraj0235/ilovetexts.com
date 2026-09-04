import { getTool } from '@/lib/tools-config';
import { notFound } from 'next/navigation';
import { LANG_CODES } from '@/lib/i18n';
import ClientTool from '@/components/ClientTool';
import GrammarChecker from '@/components/tools/GrammarChecker';
import SpellChecker from '@/components/tools/SpellChecker';
import PunctuationChecker from '@/components/tools/PunctuationChecker';
import OnlineTypingTool from '@/components/tools/OnlineTypingTool';
import RhymingDictionary from '@/components/tools/RhymingDictionary';
import AnagramGenerator from '@/components/tools/AnagramGenerator';
import WordleFinder from '@/components/tools/WordleFinder';
import ThesisGenerator from '@/components/tools/ThesisGenerator';
import EssayOutliner from '@/components/tools/EssayOutliner';
import PlagiarismChecker from '@/components/tools/PlagiarismChecker';
import VoiceConverter from '@/components/tools/VoiceConverter';
import TransitionGenerator from '@/components/tools/TransitionGenerator';
import TextCompare from '@/components/tools/TextCompare';
import WordCounter from '@/components/tools/WordCounter';
import JsonFormatter from '@/components/tools/JsonFormatter';

export async function generateStaticParams() {
  return []; // Dynamic rendering at edge to prevent ENOSPC on Cloudflare
}

export default async function EmbedToolPage({ params }) {
  const { lang, category: categoryId, tool } = await params;
  const toolData = getTool(categoryId, tool, lang);
  const t = (await import('@/lib/i18n')).getTranslations(lang);
  
  if (!toolData) {
    notFound();
  }

  const category = toolData.category;

  return (
    <div className="embed-container" style={{ padding: '0', maxWidth: '100%', margin: '0 auto' }}>
      {toolData.slug === 'grammar-checker' ? (
        <GrammarChecker t={t} />
      ) : toolData.slug === 'spell-checker' ? (
        <SpellChecker t={t} />
      ) : toolData.slug === 'punctuation-checker' ? (
        <PunctuationChecker t={t} lang={lang} />
      ) : toolData.slug === 'online-typing-tool' ? (
        <OnlineTypingTool t={t} lang={lang} />
      ) : toolData.slug === 'rhyming-dictionary' ? (
        <RhymingDictionary t={t} lang={lang} />
      ) : toolData.slug === 'anagram-generator' ? (
        <AnagramGenerator t={t} lang={lang} />
      ) : toolData.slug === 'wordle-word-finder' ? (
        <WordleFinder t={t} lang={lang} />
      ) : toolData.slug === 'thesis-statement-generator' ? (
        <ThesisGenerator t={t} lang={lang} />
      ) : toolData.slug === 'essay-outliner' ? (
        <EssayOutliner t={t} lang={lang} />
      ) : toolData.slug === 'plagiarism-checker' ? (
        <PlagiarismChecker t={t} lang={lang} />
      ) : toolData.slug === 'active-passive-converter' ? (
        <VoiceConverter t={t} lang={lang} />
      ) : toolData.slug === 'transition-word-generator' ? (
        <TransitionGenerator t={t} lang={lang} />
      ) : toolData.slug === 'text-compare' ? (
        <TextCompare t={t} lang={lang} />
      ) : toolData.slug === 'word-counter' ? (
        <WordCounter t={t} lang={lang} />
      ) : toolData.slug === 'json-formatter' ? (
        <JsonFormatter t={t} lang={lang} />
      ) : (
        <ClientTool categoryId={category.id} toolSlug={toolData.slug} t={t} />
      )}
    </div>
  );
}
