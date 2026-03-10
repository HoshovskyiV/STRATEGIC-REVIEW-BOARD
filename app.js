// Elements
const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const creativeInput = document.getElementById('creativeInput');
const startEvalBtn = document.getElementById('startEvalBtn');
const dispatcherOutput = document.getElementById('dispatcherOutput');
const progressText = document.getElementById('progressText');
const errorText = document.getElementById('errorText');
const personasSidebar = document.getElementById('personasSidebar');
const progressBarFill = document.getElementById('progressBarFill');

const readingContent = document.getElementById('readingContent');
const readerName = document.getElementById('readerName');
const readerMeta = document.getElementById('readerMeta');
const readerText = document.getElementById('readerText');
const readingPanePlaceholder = document.querySelector('.reading-pane-placeholder');

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dropOverlay = document.getElementById('dropOverlay');
const smallFilePreviewContainer = document.getElementById('smallFilePreviewContainer');
const smallFilePreview = document.getElementById('smallFilePreview');
const removeSmallFileBtn = document.getElementById('removeSmallFileBtn');
const smallFileName = document.getElementById('smallFileName');

const fileUploadState = document.getElementById('fileUploadState');
const stateDocFill = document.getElementById('stateDocFill');
const stateCheckmark = document.getElementById('stateCheckmark');

const advisorCheckboxesContainer = document.getElementById('advisorCheckboxes');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

// Init Checkboxes
PERSONAS.forEach(p => {
    const label = document.createElement('label');
    label.className = 'advisor-checkbox-label';
    label.innerHTML = `
        <input type="checkbox" value="${p.id}">
        <span>${p.name.toUpperCase()}</span>
    `;
    const checkbox = label.querySelector('input');
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) label.classList.add('is-checked');
        else label.classList.remove('is-checked');
    });
    advisorCheckboxesContainer.appendChild(label);
});

// PDF Export (High-Resolution Native Print Approach)
downloadPdfBtn.addEventListener('click', () => {
    const name = document.getElementById('readerName').innerText || 'Review';
    const meta = document.getElementById('readerMeta').innerText || '';
    const content = document.getElementById('readerText').innerHTML;

    if (!content || content.trim() === '') {
        alert('No report content to export!');
        return;
    }

    // Create a new window for printing - this is the most reliable UTF-8 PDF method.
    const printWin = window.open('', '_blank');
    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Strategic Review - ${name}</title>
            <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Unbounded:wght@400;600;800&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Lora', serif;
                    line-height: 1.6;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    color: black;
                }
                .header {
                    border-bottom: 2px solid black;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .name {
                    font-family: 'Unbounded', sans-serif;
                    font-size: 24pt;
                    margin: 0;
                    text-transform: uppercase;
                }
                .meta {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 10pt;
                    color: #555;
                    margin-top: 5px;
                }
                .content {
                    font-size: 11pt;
                    white-space: pre-wrap;
                }
                .content blockquote {
                    border-left: 3px solid black;
                    padding-left: 15px;
                    margin-left: 0;
                    font-style: italic;
                }
                @media print {
                    body { padding: 0; }
                    @page { margin: 2cm; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="name">${name}</h1>
                <div class="meta">${meta}</div>
            </div>
            <div class="content">${content}</div>
            <script>
                // Auto-trigger print and close the tab after printing is done
                window.onload = () => {
                    window.print();
                    // window.close(); // Optional: uncomment if you want the tab to close automatically
                };
            </script>
        </body>
        </html>
    `);
    printWin.document.close();
});

// File State
let currentFileBase64 = null;
let currentFileMimeType = null;

// Store responses
const responses = {};

const MODEL_NAME = "gemini-2.5-flash";

// Obfuscated Key (Basic protection from simple scrapers)
const _k = ['A', 'I', 'z', 'a', 'S', 'y', 'A', 'n', 'z', 'e', '3', 'd', 'A', 'b', 'l', 'X', 'X', 'Y', 'F', '6', 'Z', 'G', 'l', 'j', 'u', '9', 'X', 'i', 'y', 'H', 'M', '4', 'a', 'G', 'p', 'u', 'f', 'e', 'E'];
function getK() { return _k.join(''); }

async function fetchGemini(systemPrompt, userText, fileData = null) {
    const key = getK();

    const userParts = [{ text: userText }];
    if (fileData) {
        userParts.push({
            inlineData: {
                mimeType: fileData.mimeType,
                data: fileData.data
            }
        });
    }

    const body = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: userParts }],
        generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 6144
        }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${key}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok || data.error) {
        const errorDetails = data.error ? JSON.stringify(data.error, null, 2) : JSON.stringify(data, null, 2);
        console.error("Gemini API Error:", errorDetails);
        throw new Error((data.error && data.error.message ? data.error.message : "Unknown error") + "\n\nFULL LOG:\n" + errorDetails);
    }

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error("Invalid response from API");
    }
}

const PROGRESS_MESSAGES = [
    "SUMMONING STRATEGY ADVISORS...",
    "DISPATCHER PREPARING THE BRIEF...",
    "BRIEF READY. DISTRIBUTING TO ADVISORS...",
    "COLLECTING STRATEGIC REVIEW...",
    "LISTENING TO ADVISORS' CRITIQUE...",
    "ALMOST THERE, GATHERING FINAL THOUGHTS...",
    "DONE! THE BOARD HAS SPOKEN."
];

function handleFile(file) {
    // If MIME type is unknown but ends in .md, .csv, .txt etc, it could be empty string. We check extensions or just let it through as text/plain.
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isText = file.type.startsWith('text/') || file.type === 'application/json' || file.name.endsWith('.md') || file.name.endsWith('.txt');

    if (file && (isImage || isPdf || isText)) {
        currentFileMimeType = file.type || 'text/plain'; // default to text/plain if empty
        const reader = new FileReader();

        // Show fake progress UI
        smallFilePreviewContainer.style.display = 'block';
        smallFilePreview.style.display = 'none';
        fileUploadState.style.display = 'block';
        stateCheckmark.style.display = 'none';
        stateDocFill.style.height = '0%';
        removeSmallFileBtn.style.display = 'none';
        if (smallFileName) smallFileName.innerText = 'UPLOADING...';

        let p = 0;
        const fakeProgressInterval = setInterval(() => {
            p += Math.random() * 30;
            if (p > 90) p = 90;
            stateDocFill.style.height = p + '%';
        }, 50);

        reader.onload = (event) => {
            const result = event.target.result;
            currentFileBase64 = result.split(',')[1];

            clearInterval(fakeProgressInterval);
            stateDocFill.style.height = '100%';

            setTimeout(() => {
                stateCheckmark.style.display = 'flex';

                setTimeout(() => {
                    if (isImage) {
                        fileUploadState.style.display = 'none';
                        smallFilePreview.style.display = 'block';
                        smallFilePreview.src = result;
                        smallFilePreview.style.padding = "0";
                    } else {
                        // Keep the SVG document file icon permanently for non-images
                        fileUploadState.style.display = 'block';
                        smallFilePreview.style.display = 'none';
                    }
                    if (smallFileName) smallFileName.innerText = file.name;
                    removeSmallFileBtn.style.display = ''; // Reset back to CSS
                }, 800); // Wait for checkmark animation to finish
            }, 200); // Slight delay after hitting 100%
        };
        reader.readAsDataURL(file);
    } else {
        alert("Please drop a valid image, PDF, or text file.");
    }
}

// Drag and Drop Logic
dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropOverlay.style.display = 'flex';
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropOverlay.style.display = 'flex';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    // Only hide if we actually leave the container (not its children)
    if (!dropZone.contains(e.relatedTarget)) {
        dropOverlay.style.display = 'none';
    }
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropOverlay.style.display = 'none';

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// Handle Standard File Upload
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

removeSmallFileBtn.addEventListener('click', () => {
    fileInput.value = '';
    currentFileBase64 = null;
    currentFileMimeType = null;
    smallFilePreview.src = '';
    if (smallFileName) smallFileName.innerText = '';
    smallFilePreviewContainer.style.display = 'none';
});

startEvalBtn.addEventListener('click', async () => {
    const msg = creativeInput.value.trim();
    if (!msg && !currentFileBase64) {
        alert("PLEASE ENTER CREATIVE TEXT OR ATTACH A FILE!");
        return;
    }

    const selectedCheckboxes = Array.from(advisorCheckboxesContainer.querySelectorAll('input:checked'));
    if (selectedCheckboxes.length === 0) {
        alert("PLEASE SELECT AT LEAST ONE ADVISOR!");
        return;
    }
    const selectedIds = selectedCheckboxes.map(cb => parseInt(cb.value));
    const targetPersonas = PERSONAS.filter(p => selectedIds.includes(p.id));

    errorText.innerText = '';
    startEvalBtn.disabled = true;
    startEvalBtn.innerText = "PROCESSING...";

    // Hidden dispatcher
    dispatcherOutput.className = "dispatcher-box status-generating";

    personasSidebar.innerHTML = '';
    readingContent.style.display = 'none';
    readingPanePlaceholder.style.display = 'flex';

    progressText.innerText = PROGRESS_MESSAGES[0];
    progressBarFill.style.width = '5%';
    progressBarFill.classList.add('is-animating');

    // 1. Call Dispatcher
    let cleanedPrompt = "";

    const fileData = currentFileBase64 ? { data: currentFileBase64, mimeType: currentFileMimeType } : null;
    const userPrompt = msg ? "Creative text from manager:\n\n" + msg : "Please evaluate the attached file.";

    try {
        progressText.innerText = PROGRESS_MESSAGES[1];
        progressBarFill.style.width = '10%';
        cleanedPrompt = await fetchGemini(DISPATCHER_PROMPT, userPrompt, fileData);

        dispatcherOutput.className = "dispatcher-box";
        dispatcherOutput.innerText = cleanedPrompt;
    } catch (e) {
        dispatcherOutput.className = "dispatcher-box status-error";
        dispatcherOutput.innerText = "ERROR: " + e.message;
        errorText.innerText = "DISPATCHER FAILED.";
        startEvalBtn.disabled = false;
        startEvalBtn.innerText = "START EVALUATION";
        progressBarFill.classList.remove('is-animating');
        return;
    }

    // 2. Call Personas
    startEvalBtn.innerText = "EVALUATING PERSONAS...";
    progressText.innerText = PROGRESS_MESSAGES[2];
    progressBarFill.style.width = '15%';

    let completed = 0;
    const total = targetPersonas.length;
    const concurrency = 5;
    let index = 0;
    let firstCompleted = false;

    // Pre-render compact cards
    targetPersonas.forEach(p => {
        responses[p.id] = null; // null means not yet generated

        const card = document.createElement('div');
        card.className = 'compact-persona';
        card.id = `persona-${p.id}`;
        card.innerHTML = `
            <div class="compact-name">${p.name}</div>
            <div class="compact-status status-waiting" id="status-${p.id}">WAITING...</div>
        `;

        // Click to view in reading pane
        card.addEventListener('click', () => {
            document.querySelectorAll('.compact-persona').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            readingPanePlaceholder.style.display = 'none';
            readingContent.style.display = 'block';

            readerName.innerText = p.name;
            readerMeta.innerText = `${p.age ? 'AGE: ' + p.age + ' | ' : ''}${p.role}`;

            const responseTxt = responses[p.id];
            if (responseTxt === null) {
                const statusElem = document.getElementById(`status-${p.id}`);
                readerText.innerHTML = statusElem.innerText.includes('GENERATING') ? 'GENERATING RESPONSE...' : 'WAITING FOR TURN...';
                readerText.style.opacity = '0.5';
            } else {
                if (responseTxt.startsWith('ERROR:')) {
                    readerText.innerHTML = responseTxt; // Keep plain text for errors
                    readerText.style.color = 'var(--c-danger)';
                } else {
                    // PARSE MARKDOWN HERE
                    readerText.innerHTML = marked.parse(responseTxt);
                    readerText.style.color = 'inherit';
                }
                readerText.style.opacity = '1';
            }
        });

        personasSidebar.appendChild(card);
    });

    return new Promise((resolve) => {
        async function worker() {
            while (index < total) {
                const i = index++;
                const persona = targetPersonas[i];

                const statusElem = document.getElementById(`status-${persona.id}`);
                const cardElem = document.getElementById(`persona-${persona.id}`);
                statusElem.className = 'compact-status status-generating';
                statusElem.innerText = 'GENERATING...';

                // Update reader if this card is currently active
                if (cardElem.classList.contains('active')) {
                    readerText.innerHTML = 'GENERATING RESPONSE...';
                    readerText.style.opacity = '0.5';
                }

                try {
                    const response = await fetchGemini(persona.raw_prompt, cleanedPrompt, fileData);
                    responses[persona.id] = response;
                    statusElem.className = 'compact-status status-done';
                    statusElem.innerText = 'DONE';

                    if (cardElem.classList.contains('active')) {
                        readerText.innerHTML = marked.parse(response);
                        readerText.style.opacity = '1';
                        readerText.style.color = 'inherit';
                    }

                    // Auto-select the first completed response if nothing is selected
                    if (!firstCompleted) {
                        firstCompleted = true;
                        if (!document.querySelector('.compact-persona.active')) {
                            cardElem.click();
                        }
                    }
                } catch (e) {
                    responses[persona.id] = 'ERROR: ' + e.message;
                    statusElem.className = 'compact-status status-error';
                    statusElem.innerText = 'ERROR';

                    if (cardElem.classList.contains('active')) {
                        readerText.innerHTML = responses[persona.id];
                        readerText.style.opacity = '1';
                        readerText.style.color = 'var(--c-danger)';
                    }
                }

                completed++;

                // Update Progress Math: 15% to 100%
                const currentPercent = 15 + Math.floor((completed / total) * 85);
                progressBarFill.style.width = `${currentPercent}%`;

                if (completed < total * 0.3) {
                    progressText.innerText = `${completed}/${total} : ` + PROGRESS_MESSAGES[3];
                } else if (completed < total * 0.8) {
                    progressText.innerText = `${completed}/${total} : ` + PROGRESS_MESSAGES[4];
                } else if (completed < total) {
                    progressText.innerText = `${completed}/${total} : ` + PROGRESS_MESSAGES[5];
                } else {
                    progressText.innerText = PROGRESS_MESSAGES[6];
                }
            }
        }

        const workers = [];
        for (let i = 0; i < concurrency; i++) workers.push(worker());

        Promise.all(workers).then(() => {
            startEvalBtn.disabled = false;
            startEvalBtn.innerText = 'RE-EVALUATE';
            progressBarFill.classList.remove('is-animating');
            resolve();
        });
    });
});
