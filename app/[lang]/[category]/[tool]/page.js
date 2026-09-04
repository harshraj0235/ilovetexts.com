import { getAllTools, getTool, getRelatedTools, getCrossLinks, CATEGORIES, SITE } from '@/lib/tools-config';
import { generateToolMeta, generateFAQSchema, generateToolSchema, generateBreadcrumbSchema, generateHowToSchema } from '@/lib/seo';
import { getToolSEO } from '@/lib/tools-seo-data';
import { LANG_CODES, buildCanonical } from '@/lib/i18n';
import ToolLayout from '@/components/ToolLayout';
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
import ExtractEmails from '@/components/tools/ExtractEmails';
import ExtractUrls from '@/components/tools/ExtractUrls';
import ExtractPhones from '@/components/tools/ExtractPhones';
import RemoveDuplicateLines from '@/components/tools/RemoveDuplicateLines';
import BcryptGenerator from '@/components/tools/BcryptGenerator';
import JwtDecoder from '@/components/tools/JwtDecoder';
import UuidGenerator from '@/components/tools/UuidGenerator';
import FindReplace from '@/components/tools/FindReplace';
import RegexTester from '@/components/tools/RegexTester';
import PlagiarismChecker from '@/components/tools/PlagiarismChecker';
import VoiceConverter from '@/components/tools/VoiceConverter';
import TransitionGenerator from '@/components/tools/TransitionGenerator';
import TextCompare from '@/components/tools/TextCompare';
import WordCounter from '@/components/tools/WordCounter';
import JsonFormatter from '@/components/tools/JsonFormatter';
import PiiRedactor from '@/components/tools/PiiRedactor';
import PromptMinifier from '@/components/tools/PromptMinifier';
import CaptionFormatter from '@/components/tools/CaptionFormatter';
import JsonToMarkdown from '@/components/tools/JsonToMarkdown';
import ViceCityHeadlineGenerator from '@/components/tools/ViceCityHeadlineGenerator';
import ViceCityLicensePlate from '@/components/tools/ViceCityLicensePlate';
import Gta6PcBuilder from '@/components/tools/Gta6PcBuilder';
import ViceCitySpeculationMap from '@/components/tools/ViceCitySpeculationMap';
import ViceCityRapSheet from '@/components/tools/ViceCityRapSheet';
import ExcelEditor from '@/components/tools/ExcelEditor';
import PdfTextEditor from '@/components/tools/PdfTextEditor';
import ImageTextEditor from '@/components/tools/ImageTextEditor';
import WordDocumentEditor from '@/components/tools/WordDocumentEditor';
import TextFileEditor from '@/components/tools/TextFileEditor';
import TypingSpeedTest from '@/components/tools/TypingSpeedTest';
import OnlineNotepad from '@/components/tools/OnlineNotepad';
import SpeechToText from '@/components/tools/SpeechToText';
import AITextHumanizer from '@/components/tools/AITextHumanizer';
import TextToHandwriting from '@/components/tools/TextToHandwriting';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  return []; // Dynamic rendering at edge to prevent ENOSPC on Cloudflare
}

export async function generateMetadata({ params }) {
  const { lang, category, tool } = await params;
  const toolData = getTool(category, tool, lang);
  if (!toolData) return {};
  return generateToolMeta(toolData, toolData.category, lang);
}

// ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

// ==========================================
// DYNAMIC CONTENT GENERATORS
// Pulls localized data from content JSONs
// ==========================================

function generateWhatIs(toolData, t) {
  return toolData.content?.whatIs || `${t.schema.howToDesc.replace('{toolName}', toolData.name).replace('{domain}', 'ilovetexts.com')} ${toolData.description}`;
}

function generateWhyChoose(toolData, t) {
  if (toolData.content?.whyChoose?.length > 0) return toolData.content.whyChoose;
  
  return [
    { icon: '🚀', title: t.trust.instantTitle, description: t.trust.instantDesc },
    { icon: '🔒', title: t.trust.privateTitle, description: t.trust.privateDesc },
    { icon: '💻', title: t.trust.freeTitle, description: t.trust.freeDesc }
  ];
}

function generateUseCases(toolData, category) {
  return toolData.content?.useCases || [];
}

function generateFAQs(toolData, t) {
  if (toolData.content?.faqs?.length > 0) return toolData.content.faqs;
  
  const toolName = toolData.name;
  
  return [
    { question: t.ui.fallbackFaqQ?.replace('{toolName}', toolName) || `Is the ${toolName} free to use?`, answer: t.ui.fallbackFaqA || `Yes, it is 100% free with no limits.` },
    { question: t.ui.fallbackFaqQ2?.replace('{toolName}', toolName) || `Do you save my text when using ${toolName}?`, answer: t.ui.fallbackFaqA2 || `No, all processing happens locally in your browser. We never see or store your data.` }
  ];
}

function generateRelatedSearches(toolData) {
  return toolData.content?.relatedSearches || [];
}

function getSmartCrossLinks(categoryId, toolSlug, lang = 'en') {
  const allTools = getAllTools(lang);
  const otherTools = allTools.filter(t => t.categoryId !== categoryId);
  
  // Deterministic pseudo-random selection based on the tool's slug
  // This ensures the same tool always recommends the same 6 cross-links (stable for SEO),
  // but distributes the PageRank perfectly across all 120+ tools instead of just the first 6.
  let hash = 0;
  for (let i = 0; i < toolSlug.length; i++) {
    hash = ((hash << 5) - hash) + toolSlug.charCodeAt(i);
    hash |= 0; 
  }
  
  const seed = Math.abs(hash);
  const selected = [];
  const available = [...otherTools];
  
  for (let i = 0; i < 6; i++) {
    if (available.length === 0) break;
    const index = (seed + i * 17) % available.length;
    selected.push(available[index]);
    available.splice(index, 1);
  }
  
  return selected;
}

export default async function ToolPage({ params }) {
  const { lang, category: categoryId, tool } = await params;
  const toolData = getTool(categoryId, tool, lang);
  const t = (await import('@/lib/i18n')).getTranslations(lang);
  
  if (!toolData) {
    notFound();
  }

  const category = toolData.category;
  const relatedTools = getRelatedTools(category.id, toolData.slug, lang, 12);
  const crossLinks = getCrossLinks(category.id, lang, 6);
  const smartCrossLinks = getSmartCrossLinks(category.id, toolData.slug, lang);

  // Generate all SEO content
  const whatIs = generateWhatIs(toolData, t);
  const whyChoose = generateWhyChoose(toolData, t);
  const useCases = generateUseCases(toolData, category);
  const faqs = generateFAQs(toolData, t);
  const relatedSearches = generateRelatedSearches(toolData);

  const howToSteps = [
    {
      title: t.schema.step1Title,
      description: t.schema.step1Desc
    },
    {
      title: t.schema.step2Title,
      description: t.schema.step2Desc.replace('{toolName}', toolData.name)
    },
    {
      title: t.schema.step3Title,
      description: t.schema.step3Desc
    }
  ];

  // Generate all structured data schemas
  const faqSchema = generateFAQSchema(faqs);
  const toolSchema = generateToolSchema(toolData, category, t);
  const howToSchema = generateHowToSchema(toolData, howToSteps, t);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.nav.home, url: buildCanonical(lang, '/') },
    { name: category.name, url: buildCanonical(lang, `/${category.id}`) },
    { name: toolData.name, url: buildCanonical(lang, `/${category.id}/${toolData.slug}`) }
  ]);

  // Deduplicate crossLinks
  const combinedCrossLinks = [];
  const seenSlugs = new Set();
  for (const item of [...smartCrossLinks, ...crossLinks]) {
    const key = `${item.categoryId || category.id}-${item.slug}`;
    if (!seenSlugs.has(key)) {
      seenSlugs.add(key);
      combinedCrossLinks.push(item);
    }
  }

  return (
    <>
      <script id="schema-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="schema-tool" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <script id="schema-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script id="schema-breadcrumbs" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <ToolLayout 
        tool={toolData} 
        category={category} 
        relatedTools={relatedTools}
        crossLinks={combinedCrossLinks.slice(0, 8)}
        faqs={faqs}
        howToSteps={howToSteps}
        whatIs={whatIs}
        whyChoose={whyChoose}
        useCases={useCases}
        relatedSearches={relatedSearches}
        allCategories={CATEGORIES}
        lang={lang}
      >
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
        ) : toolData.slug === 'extract-emails' ? (
          <ExtractEmails t={t} lang={lang} />
        ) : toolData.slug === 'extract-urls' ? (
          <ExtractUrls t={t} lang={lang} />
        ) : toolData.slug === 'extract-phones' ? (
          <ExtractPhones t={t} lang={lang} />
        ) : toolData.slug === 'remove-duplicate-lines' ? (
          <RemoveDuplicateLines t={t} lang={lang} />
        ) : toolData.slug === 'bcrypt-generator' ? (
          <BcryptGenerator t={t} lang={lang} />
        ) : toolData.slug === 'jwt-decoder' ? (
          <JwtDecoder t={t} lang={lang} />
        ) : toolData.slug === 'uuid-generator' ? (
          <UuidGenerator t={t} lang={lang} />
        ) : toolData.slug === 'find-replace' ? (
          <FindReplace t={t} lang={lang} />
        ) : toolData.slug === 'regex-tester' ? (
          <RegexTester t={t} lang={lang} />
        ) : toolData.slug === 'pii-redactor' ? (
          <PiiRedactor t={t} lang={lang} />
        ) : toolData.slug === 'prompt-minifier' ? (
          <PromptMinifier t={t} lang={lang} />
        ) : toolData.slug === 'caption-formatter' ? (
          <CaptionFormatter t={t} lang={lang} />
        ) : toolData.slug === 'json-to-markdown' ? (
          <JsonToMarkdown t={t} lang={lang} />
        ) : toolData.slug === 'vice-city-headline-generator' ? (
          <ViceCityHeadlineGenerator t={t} lang={lang} />
        ) : toolData.slug === 'vice-city-license-plate' ? (
          <ViceCityLicensePlate t={t} lang={lang} />
        ) : toolData.slug === 'gta-6-pc-requirements' ? (
          <Gta6PcBuilder t={t} lang={lang} />
        ) : toolData.slug === 'vice-city-speculation-map' ? (
          <ViceCitySpeculationMap t={t} lang={lang} />
        ) : toolData.slug === 'vice-city-rap-sheet' ? (
          <ViceCityRapSheet t={t} lang={lang} />
        ) : toolData.slug === 'excel-editor' ? (
          <ExcelEditor t={t} lang={lang} />
        ) : toolData.slug === 'pdf-text-editor' ? (
          <PdfTextEditor t={t} lang={lang} />
        ) : toolData.slug === 'merge-pdf' ? (
          <PdfTextEditor t={t} lang={lang} initialMode="pages" />
        ) : toolData.slug === 'annotate-pdf' ? (
          <PdfTextEditor t={t} lang={lang} initialMode="annotate" />
        ) : toolData.slug === 'sign-pdf' ? (
          <PdfTextEditor t={t} lang={lang} initialMode="sign" />
        ) : toolData.slug === 'redact-pdf' ? (
          <PdfTextEditor t={t} lang={lang} initialMode="redact" />
        ) : toolData.slug === 'watermark-pdf' ? (
          <PdfTextEditor t={t} lang={lang} initialMode="watermark" />
        ) : toolData.slug === 'compress-pdf' ? (
          <PdfTextEditor t={t} lang={lang} initialMode="export" />
        ) : toolData.slug === 'protect-pdf' ? (
          <PdfTextEditor t={t} lang={lang} initialMode="export" />
        ) : toolData.slug === 'image-text-editor' ? (
          <ImageTextEditor t={t} lang={lang} />
        ) : toolData.slug === 'word-document-editor' ? (
          <WordDocumentEditor t={t} lang={lang} />
        ) : toolData.slug === 'text-file-editor' ? (
          <TextFileEditor t={t} lang={lang} />
        ) : toolData.slug === 'universal-file-editor' ? (
          <PdfTextEditor t={t} lang={lang} />
        ) : toolData.slug === 'typing-speed-test' ? (
          <TypingSpeedTest t={t} lang={lang} />
        ) : toolData.slug === 'online-notepad' ? (
          <OnlineNotepad t={t} lang={lang} />
        ) : toolData.slug === 'speech-to-text' ? (
          <SpeechToText t={t} lang={lang} />
        ) : toolData.slug === 'ai-text-humanizer' ? (
          <AITextHumanizer t={t} lang={lang} />
        ) : toolData.slug === 'text-to-handwriting' ? (
          <TextToHandwriting t={t} lang={lang} />
        ) : (
          <ClientTool categoryId={category.id} toolSlug={toolData.slug} t={t} />
        )}
      </ToolLayout>
    </>
  );
}
