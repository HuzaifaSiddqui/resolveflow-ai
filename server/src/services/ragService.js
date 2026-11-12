import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';

// Calculate Cosine Similarity between two numeric vectors
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Deterministic local embedding fallback (128-dimensional hashed bag-of-words & character n-grams)
// Used when no OPENAI_API_KEY is provided or offline.
export const generateLocalFallbackEmbedding = (text, dim = 128) => {
  const vec = new Array(dim).fill(0);
  if (!text) return vec;

  const clean = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1;
  }

  // Add character 3-grams for subword matching
  for (let i = 0; i < clean.length - 2; i++) {
    const gram = clean.substring(i, i + 3);
    let hash = 0;
    for (let j = 0; j < 3; j++) {
      hash = (hash << 5) - hash + gram.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 0.5;
  }

  // Normalize vector to unit length
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) vec[i] = vec[i] / norm;
  }
  return vec;
};

// Generate embedding using OpenAI or fallback
export const getEmbedding = async (text, apiKey = null) => {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    return generateLocalFallbackEmbedding(text);
  }

  try {
    const openai = new OpenAI({ apiKey: key });
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n+/g, ' ').substring(0, 8000),
    });
    return response.data[0].embedding;
  } catch (err) {
    console.warn(`[RAG] OpenAI Embedding API failed (${err.message}). Using local fallback embedding.`);
    return generateLocalFallbackEmbedding(text);
  }
};

// Text chunking utility: split text into overlapping chunks
export const chunkText = (text, maxWords = 150, overlapWords = 30) => {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return [text.trim()];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < words.length) {
    const endIndex = Math.min(startIndex + maxWords, words.length);
    const chunkWords = words.slice(startIndex, endIndex);
    chunks.push(chunkWords.join(' '));
    if (endIndex >= words.length) break;
    startIndex += maxWords - overlapWords;
  }

  return chunks;
};

// Extract text from buffer or file content
export const extractDocumentText = async (fileBuffer, mimeType, originalName) => {
  if (mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
    const data = await pdfParse(fileBuffer);
    return data.text || '';
  }
  return fileBuffer.toString('utf-8');
};

// Index document: extract, chunk, embed, and store
export const indexKnowledgeDocument = async ({
  documentId,
  workspaceId,
  rawText,
  apiKey = null,
}) => {
  const doc = await KnowledgeDocument.findById(documentId);
  if (!doc) throw new Error('Document not found');

  try {
    doc.status = 'processing';
    await doc.save();

    const cleanText = rawText.replace(/\r\n/g, '\n').trim();
    doc.characterCount = cleanText.length;

    const chunks = chunkText(cleanText, 150, 30);
    doc.chunkCount = chunks.length;

    // Delete existing chunks for this document
    await KnowledgeChunk.deleteMany({ documentId: doc._id });

    // Generate embeddings and store chunks
    const chunkDocs = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const embedding = await getEmbedding(chunkText, apiKey);
      chunkDocs.push({
        workspaceId,
        documentId: doc._id,
        chunkIndex: i,
        content: chunkText,
        embedding,
        metadata: {
          title: doc.title,
          category: doc.category,
          type: doc.type,
        },
      });
    }

    if (chunkDocs.length > 0) {
      await KnowledgeChunk.insertMany(chunkDocs);
    }

    doc.status = 'indexed';
    doc.errorMessage = undefined;
    await doc.save();

    return { success: true, chunkCount: chunks.length };
  } catch (error) {
    console.error(`[RAG] Indexing failed for doc ${documentId}:`, error);
    doc.status = 'failed';
    doc.errorMessage = error.message;
    await doc.save();
    throw error;
  }
};

// Search knowledge base using cosine similarity
export const searchKnowledgeBase = async ({
  workspaceId,
  query,
  limit = 4,
  threshold = 0.5,
  apiKey = null,
}) => {
  if (!query || !query.trim()) return [];

  const queryEmbedding = await getEmbedding(query, apiKey);
  const chunks = await KnowledgeChunk.find({ workspaceId }).populate('documentId', 'title category status');

  const scoredChunks = [];

  for (const chunk of chunks) {
    // Only search active/indexed documents
    if (chunk.documentId && chunk.documentId.status === 'failed') continue;

    let score = 0;
    if (chunk.embedding && chunk.embedding.length > 0 && chunk.embedding.length === queryEmbedding.length) {
      score = cosineSimilarity(queryEmbedding, chunk.embedding);
    } else {
      // Fallback keyword score if dimension mismatch (e.g. switched between openai and fallback)
      const qWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const cLower = chunk.content.toLowerCase();
      let matches = 0;
      for (const w of qWords) {
        if (cLower.includes(w)) matches++;
      }
      score = qWords.length > 0 ? (matches / qWords.length) * 0.75 : 0;
    }

    if (score >= threshold) {
      scoredChunks.push({
        id: chunk._id,
        documentId: chunk.documentId?._id,
        documentTitle: chunk.documentId?.title || chunk.metadata?.title || 'Knowledge Base',
        category: chunk.metadata?.category || 'General',
        content: chunk.content,
        score: Math.round(score * 1000) / 1000,
      });
    }
  }

  // Sort by highest similarity
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, limit);
};
