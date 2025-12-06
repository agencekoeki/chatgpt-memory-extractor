// ChatGPT Memory Extractor - Service Worker v1.0
// Persistance et gestion des tâches d'analyse

import { Storage } from './storage.js';
import { AnalysisPipeline } from './analysis.js';

// ========== STATE ==========
let analysisQueue = [];
let isProcessing = false;

// ========== INIT ==========
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Memory Extractor installed');
  Storage.init();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Background] Memory Extractor started');
  Storage.init();
});

// ========== MESSAGE HANDLING ==========
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender) {
  switch (request.action) {
    // ===== STORAGE =====
    case 'saveMemories':
      return await Storage.saveMemories(request.memories);

    case 'getMemories':
      return await Storage.getMemories();

    case 'clearMemories':
      return await Storage.clearMemories();

    // ===== SETTINGS =====
    case 'saveApiKeys':
      return await Storage.saveApiKeys(request.keys);

    case 'getApiKeys':
      return await Storage.getApiKeys();

    case 'saveSettings':
      return await Storage.saveSettings(request.settings);

    case 'getSettings':
      return await Storage.getSettings();

    // ===== ANALYSIS =====
    case 'startAnalysis':
      return await startAnalysis(request.memories, request.options);

    case 'getAnalysisStatus':
      return getAnalysisStatus();

    case 'getAnalysisResults':
      return await Storage.getAnalysisResults();

    case 'clearAnalysisResults':
      return await Storage.clearMemories(); // Clears memories, labels, and analysis

    case 'clearAll':
      // Full reset: clear all data and reset state
      isProcessing = false;
      analysisQueue = [];
      await Storage.clearMemories(); // Clears memories, labels, and analysis
      console.log('[Background] All data cleared');
      return { success: true };

    case 'cancelAnalysis':
      return cancelAnalysis();

    // ===== REPORT =====
    case 'openReport':
      return openReportPage();

    default:
      return { error: 'Unknown action: ' + request.action };
  }
}

// ========== ANALYSIS ==========
async function startAnalysis(memories, options = {}) {
  if (isProcessing) {
    return { error: 'Analysis already in progress' };
  }

  try {
    isProcessing = true;
    const keys = await Storage.getApiKeys();

    if (!keys.anthropic && !keys.openai && !keys.google) {
      isProcessing = false;
      return { error: 'No API keys configured' };
    }

    // Save memories first
    await Storage.saveMemories(memories);

    // Start pipeline
    const pipeline = new AnalysisPipeline(keys, options);

    // Notify popup of progress
    const onProgress = (stage, progress, message) => {
      chrome.runtime.sendMessage({
        action: 'analysisProgress',
        stage,
        progress,
        message
      }).catch(() => {});
    };

    const results = await pipeline.analyze(memories, onProgress);

    // Save results
    await Storage.saveAnalysisResults(results);

    isProcessing = false;

    // Notify completion
    chrome.runtime.sendMessage({
      action: 'analysisComplete',
      results
    }).catch(() => {});

    return { success: true, results };

  } catch (error) {
    isProcessing = false;
    console.error('[Background] Analysis error:', error);
    return { error: error.message };
  }
}

function getAnalysisStatus() {
  return {
    isProcessing,
    queueLength: analysisQueue.length
  };
}

function cancelAnalysis() {
  isProcessing = false;
  analysisQueue = [];
  return { success: true };
}

// ========== REPORT PAGE ==========
function openReportPage() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('report.html')
  });
  return { success: true };
}

// ========== KEEP ALIVE ==========
// Service workers can be terminated, this keeps it alive during analysis
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20000);
chrome.runtime.onStartup.addListener(keepAlive);
chrome.runtime.onInstalled.addListener(keepAlive);
