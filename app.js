/**
 * AI Literacy Coach - Main Application Logic
 */
import { MODELS, SDG_INFO } from './constants.js';
import { analyzePrompt } from './gemini.js';

// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const userPromptInput = document.getElementById('userPrompt');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsArea = document.getElementById('results');
const loadingArea = document.getElementById('loading');
const overallScoreEl = document.getElementById('overallScore');
const overallProgress = document.getElementById('overallProgress');

// Metric Elements
const clarityVal = document.getElementById('clarityVal');
const clarityBar = document.getElementById('clarityBar');
const specificityVal = document.getElementById('specificityVal');
const specificityBar = document.getElementById('specificityBar');
const depthVal = document.getElementById('depthVal');
const depthBar = document.getElementById('depthBar');

const detailedFeedback = document.getElementById('detailedFeedback');
const suggestionsList = document.getElementById('suggestionsList');
const improvedPromptText = document.getElementById('improvedPromptText');

// Modals
const sdgModal = document.getElementById('sdgModal');
const showSdgBtn = document.getElementById('showSdg');
const closeSdgBtn = document.getElementById('closeSdg');
const sdgTitle = document.getElementById('sdgTitle');
const sdgContent = document.getElementById('sdgContent');

/**
 * Initialize Application
 */
function init() {
    // Load saved settings
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) apiKeyInput.value = savedKey;

    // Event Listeners
    analyzeBtn.addEventListener('click', handleAnalyze);
    
    apiKeyInput.addEventListener('change', () => {
        localStorage.setItem('gemini_api_key', apiKeyInput.value);
    });

    // Modal Listeners
    showSdgBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sdgTitle.textContent = SDG_INFO.title;
        sdgContent.innerHTML = `<p>${SDG_INFO.content}</p>`;
        sdgModal.classList.remove('hidden');
    });

    closeSdgBtn.addEventListener('click', () => {
        sdgModal.classList.add('hidden');
    });

    // Close modal on click outside
    window.addEventListener('click', (e) => {
        if (e.target === sdgModal) sdgModal.classList.add('hidden');
    });
}

/**
 * Handle Analysis Request
 */
async function handleAnalyze() {
    const prompt = userPromptInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!prompt) {
        alert("Please enter a prompt to analyze.");
        return;
    }

    if (!apiKey) {
        alert("Please enter your Gemini API Key in the settings sidebar.");
        return;
    }

    // UI Updates
    analyzeBtn.disabled = true;
    resultsArea.classList.add('hidden');
    loadingArea.classList.remove('hidden');

    try {
        const evaluation = await analyzePrompt(apiKey, 'gemini-3-flash-preview', prompt);
        displayResults(evaluation);
    } catch (error) {
        alert(error.message);
    } finally {
        analyzeBtn.disabled = false;
        loadingArea.classList.add('hidden');
    }
}

/**
 * Render Results to UI
 */
function displayResults(data) {
    resultsArea.classList.remove('hidden');
    
    // Animate overall score
    animateValue(overallScoreEl, 0, data.score, 1000);
    overallProgress.style.width = `${data.score}%`;

    // Metrics
    updateMetric('clarity', data.metrics.clarity);
    updateMetric('specificity', data.metrics.specificity);
    updateMetric('depth', data.metrics.depth);

    // Textual Feedback
    detailedFeedback.innerHTML = data.feedback;

    // Suggestions
    suggestionsList.innerHTML = '';
    data.suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `<span class="bullet">→</span> <span>${suggestion}</span>`;
        suggestionsList.appendChild(div);
    });

    // Improved Prompt
    improvedPromptText.textContent = `"${data.improvedPrompt}"`;

    // Scroll to results
    resultsArea.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Helper to update metric UI
 */
function updateMetric(id, value) {
    const valEl = document.getElementById(`${id}Val`);
    const barEl = document.getElementById(`${id}Bar`);
    valEl.textContent = `${value}/10`;
    barEl.style.width = `${value * 10}%`;
}

/**
 * Helper to animate numbers
 */
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Start the app
init();
