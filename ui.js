/**
 * @file app.js
 * * Main application file.
 * - Defines global state and constants.
 * - Initializes the application.
 * - Handles all UI event listeners.
 * - Manages the animation loop.
 * - Updates all UI elements (stats, buttons, etc.).
 * * This file depends on algorithms.js and animation.js.
 */

// Run the application once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL CONSTANTS ---
    // These are defined on the window object to be accessible by other scripts
    window.DISK_MAX = 199;
    window.POINT_RADIUS = 6;
    window.PADDING = 40; // Canvas padding on left/right
    window.HEAD_Y = 50; // Y-position for the disk head
    window.REQUEST_Y = 90; // Y-position for requests
    
    // Pastel Color Palette
    window.COLORS = {
        pending: '#a7c7e7', // Pastel Blue
        served: '#bce2b4', // Pastel Green
        head: '#f4a4a4'    // Pastel Red
    };

    // Algorithm Descriptions
    window.ALGO_DESCRIPTIONS = {
        'fcfs': 'Simple. In-order queue.',
        'sstf': 'Greedy. Minimizes seek.',
        'scan': 'Elevator. Sweeps to end.',
        'c-scan': 'Circular. Sweeps to end.',
        'look': 'Elevator. Sweeps to last.',
        'c-look': 'Circular. Sweeps to last.'
    };

    // --- DOM ELEMENTS (Global) ---
    // Canvas and Context
    window.canvas = document.getElementById('diskCanvas');
    window.ctx = window.canvas.getContext('2d');
    
    // Theme
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    const errorMessageBox = document.getElementById('error-message');

    // Inputs
    window.algorithmSelect = document.getElementById('algorithm');
    const algoDescription = document.getElementById('algo-description');
    const reqInput = document.getElementById('requests');
    const headInput = document.getElementById('startHead');
    const dirSelect = document.getElementById('direction');
    const btnRandom = document.getElementById('btnRandom');
    const randomCountInput = document.getElementById('randomCount');
    
    // Controls
    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnReset = document.getElementById('btnReset');
    const btnStepFwd = document.getElementById('btnStepFwd');
    const btnStepBack = document.getElementById('btnStepBack');
    const speedControl = document.getElementById('speedControl');
    const timelineScrubber = document.getElementById('timelineScrubber');
    
    // Outputs
    const totalSeekOutput = document.getElementById('totalSeekOutput');
    const avgSeekOutput = document.getElementById('avgSeekOutput');
    const sequenceOutput = document.getElementById('sequenceOutput');
    
    // Export
    const btnExportPNG = document.getElementById('btnExportPNG');
    const btnExportTXT = document.getElementById('btnExportTXT');
    
    // Compare Modal
    const btnCompare = document.getElementById('btnCompare');
    const compareModal = document.getElementById('compareModal');
    const closeCompareModal = document.getElementById('closeCompareModal');
    const compareModalInputs = document.getElementById('compareModalInputs');
    const compareModalTableBody = document.getElementById('compareModalTableBody');


    // --- GLOBAL APPLICATION STATE ---
    window.history = []; // Stores the full animation path, state by state
    window.currentStateIndex = 0; // Pointer to the current state in `history`
    window.isPlaying = false;
    window.animationSpeed = 500; // Default speed
    window.timerId = null;
    window.originalRequestSet = new Set(); // Stores the initial parsed requests

    
    // ===================================================================
    // INITIALIZATION AND EVENT LISTENERS
    // ===================================================================

    /**
     * Initializes the application.
     */
    function init() {
        setupTheme();
        resizeCanvas(); // from animation.js
        draw(); // from animation.js
        updateUI();
        addEventListeners();
        updateAlgoDescription(); // Set initial description
        window.animationSpeed = parseInt(document.querySelector('input[name="speed"]:checked').value, 10);
    }

    /**
     * Adds all event listeners.
     */
    function addEventListeners() {
        window.addEventListener('resize', () => {
            resizeCanvas(); // from animation.js
            draw(); // from animation.js
        });
        
        themeToggleBtn.addEventListener('click', handleThemeToggle);
        btnRandom.addEventListener('click', handleRandomInputs);
        window.algorithmSelect.addEventListener('change', updateAlgoDescription);

        btnStart.addEventListener('click', handleStart);
        btnPause.addEventListener('click', handlePause);
        btnReset.addEventListener('click', handleReset);
        btnStepFwd.addEventListener('click', handleStepForward);
        btnStepBack.addEventListener('click', handleStepBackward);
        
        speedControl.addEventListener('change', (e) => {
            window.animationSpeed = parseInt(e.target.value, 10);
        });
        
        timelineScrubber.addEventListener('input', handleScrubberInput);
        
        btnExportPNG.addEventListener('click', handleExportPNG);
        btnExportTXT.addEventListener('click', handleExportTXT);
        
        btnCompare.addEventListener('click', handleCompareAll);
        closeCompareModal.addEventListener('click', () => compareModal.classList.add('hidden'));
    }

    // ===================================================================
    // THEME AND UI
    // ===================================================================

    /**
     * Sets up the initial theme based on localStorage or OS preference.
     */
    function setupTheme() {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            moonIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            sunIcon.classList.remove('hidden');
        }
    }

    /**
     * Handles the theme toggle button click.
     */
    function handleThemeToggle() {
        if (document.documentElement.classList.toggle('dark')) {
            localStorage.theme = 'dark';
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            localStorage.theme = 'light';
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        }
        draw(); // Redraw canvas with new theme colors
    }
    
    /**
     * Checks if dark mode is currently active.
     * @returns {boolean} True if dark mode is on.
     */
    window.isDarkMode = function() {
        return document.documentElement.classList.contains('dark');
    }

    /**
     * Shows an error message in the UI.
     * @param {string} message The error message to display.
     */
    function showError(message) {
        errorMessageBox.textContent = message;
        errorMessageBox.classList.remove('hidden');
    }

    /**
     * Clears any visible error messages.
     */
    function clearError() {
        errorMessageBox.classList.add('hidden');
        errorMessageBox.textContent = '';
    }

    /**
     * Updates the algorithm description text.
     */
    function updateAlgoDescription() {
        const algo = window.algorithmSelect.value;
        algoDescription.textContent = window.ALGO_DESCRIPTIONS[algo] || '';
    }

    /**
     * Updates all non-canvas UI elements (stats, buttons).
     */
    function updateUI() {
        if (window.history.length <= 1) { // 0 or 1 (only start)
            totalSeekOutput.textContent = '0';
            avgSeekOutput.textContent = '0.00';
            // Use theme-aware text color for placeholder
            sequenceOutput.innerHTML = '<span class="text-gray-400 dark:text-gray-500">Waiting for simulation...</span>';
        } else {
            const state = window.history[window.currentStateIndex];
            totalSeekOutput.textContent = state.seek;
            // Use originalRequestSet.size for avg
            avgSeekOutput.textContent = (window.originalRequestSet.size > 0 ? (state.seek / window.originalRequestSet.size) : 0).toFixed(2);
            
            if (state.servedOrder.length > 0) {
                sequenceOutput.textContent = state.servedOrder.join(' → ');
            } else {
                // Use theme-aware text color for placeholder
                sequenceOutput.innerHTML = '<span class="text-gray-400 dark:text-gray-500">Moving to first request...</span>';
            }
        }
        
        timelineScrubber.value = window.currentStateIndex;
        updateButtonStates();
    }

    /**
     * Enables/disables control buttons based on the current state.
     */
    function updateButtonStates() {
        const atStart = (window.currentStateIndex === 0);
        const atEnd = (window.currentStateIndex >= window.history.length - 1); // >= to handle empty history
        const hasHistory = window.history.length > 1;

        btnStart.disabled = window.isPlaying || (hasHistory && atEnd);
        btnPause.disabled = !window.isPlaying;
        btnReset.disabled = window.isPlaying;
        
        btnStepFwd.disabled = window.isPlaying || (hasHistory && atEnd);
        btnStepBack.disabled = window.isPlaying || !hasHistory || atStart;

        // Disable inputs while playing or history exists
        reqInput.disabled = window.isPlaying || hasHistory;
        headInput.disabled = window.isPlaying || hasHistory;
        dirSelect.disabled = window.isPlaying || hasHistory;
        btnRandom.disabled = window.isPlaying || hasHistory;
        window.algorithmSelect.disabled = window.isPlaying || hasHistory;
        randomCountInput.disabled = window.isPlaying || hasHistory;
        btnCompare.disabled = window.isPlaying || hasHistory;
        
        timelineScrubber.disabled = !hasHistory;
    }


    // ===================================================================
    // INPUT PARSING AND VALIDATION
    // ===================================================================

    /**
     * Parses and validates user inputs.
     * @param {boolean} [show=true] - Whether to show errors in the UI.
     * @returns {object|null} An object with requests, startHead, and direction, or null if invalid.
     */
    window.parseInputs = function(show = true) {
        const reqStr = reqInput.value;
        const headStr = headInput.value;
        
        const requests = reqStr.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n >= 0 && n <= window.DISK_MAX);
        
        const startHead = parseInt(headStr);
        const direction = dirSelect.value;

        if (isNaN(startHead) || startHead < 0 || startHead > window.DISK_MAX) {
            if (show) showError('Invalid Start Head. Must be between 0 and 199.');
            return null;
        }
        
        if (requests.length === 0) {
            if (show) showError('No valid requests. Please enter numbers between 0 and 199.');
            return null;
        }

        // FCFS needs the original list
        if (window.algorithmSelect.value === 'fcfs') {
            return { requests, startHead, direction };
        }
        
        // Other algorithms use a unique, sorted list
        const uniqueRequests = [...new Set(requests)];
        uniqueRequests.sort((a, b) => a - b);
        return { requests: uniqueRequests, startHead, direction };
    }


    // ===================================================================
    // ANIMATION AND CONTROL HANDLERS
    // ===================================================================

    /**
     * The main animation loop.
     */
    function animateLoop() {
        if (!window.isPlaying) return;
        
        if (window.currentStateIndex < window.history.length - 1) {
            window.currentStateIndex++;
            draw();
            updateUI();
            window.timerId = setTimeout(animateLoop, window.animationSpeed);
        } else {
            window.isPlaying = false;
            updateUI();
        }
    }

    /**
     * Handles the "Generate" button click.
     */
    function handleRandomInputs() {
        if (window.isPlaying) return;
        handleReset(); // Clear any existing simulation

        let count = parseInt(randomCountInput.value, 10);
        if (isNaN(count) || count < 5 || count > 50) {
            showError("Please enter a count between 5 and 50.");
            return;
        }
        
        let requests = new Set();
        while (requests.size < count) {
            requests.add(Math.floor(Math.random() * (window.DISK_MAX + 1)));
        }
        
        const startHead = Math.floor(Math.random() * (window.DISK_MAX + 1));
        const direction = Math.random() > 0.5 ? 'right' : 'left';

        reqInput.value = [...requests].join(', ');
        headInput.value = startHead;
        dirSelect.value = direction;

        draw();
    }

    /**
     * Handles the "Start" button click.
     */
    function handleStart() {
        if (window.isPlaying) return;
        clearError();

        // Setup simulation if it's the first run
        if (window.history.length <= 1) {
            const inputs = parseInputs();
            if (!inputs) return; // Stop if inputs are invalid
            
            // Call the function from algorithms.js
            calculateSimulationHistory(window.algorithmSelect.value, inputs.requests, inputs.startHead, inputs.direction);
            
            // Update timeline scrubber max value
            timelineScrubber.max = window.history.length - 1;
        }
        
        // Resume from end
        if (window.currentStateIndex >= window.history.length - 1) {
            window.currentStateIndex = 0; // Restart
        }

        window.isPlaying = true;
        updateUI();
        animateLoop();
    }

    /**
     * Handles the "Pause" button click.
     */
    function handlePause() {
        if (!window.isPlaying) return;
        window.isPlaying = false;
        clearTimeout(window.timerId);
        updateUI();
    }

    /**
     * Handles the "Reset" button click.
     */
    function handleReset() {
        window.isPlaying = false;
        clearError();
        clearTimeout(window.timerId);
        
        window.history = [];
        window.currentStateIndex = 0;
        window.originalRequestSet.clear();

        timelineScrubber.max = 0;
        timelineScrubber.value = 0;

        draw();
        updateUI();
    }

    /**
     * Handles the "Step Forward" button click.
     */
    function handleStepForward() {
        if (window.isPlaying) return;
        clearError();

        // Setup simulation if it's the first run
        if (window.history.length <= 1) {
            const inputs = parseInputs();
            if (!inputs) return; // Stop if inputs are invalid
            
            calculateSimulationHistory(window.algorithmSelect.value, inputs.requests, inputs.startHead, inputs.direction);
            timelineScrubber.max = window.history.length - 1;
        }

        if (window.currentStateIndex < window.history.length - 1) {
            window.currentStateIndex++;
            draw();
            updateUI();
        }
    }

    /**
     * Handles the "Step Backward" button click.
     */
    function handleStepBackward() {
        if (window.isPlaying || window.currentStateIndex === 0) return;

        if (window.currentStateIndex > 0) {
            window.currentStateIndex--;
            draw();
            updateUI();
        }
    }
    
    /**
     * Handles the timeline scrubber being moved.
     */
    function handleScrubberInput(e) {
        if (window.isPlaying) {
            handlePause();
        }
        window.currentStateIndex = parseInt(e.target.value, 10);
        draw();
        updateUI();
    }


    // ===================================================================
    // EXPORT AND COMPARE HANDLERS
    // ===================================================================

    /**
     * Handles the "Export PNG" button click.
     */
    function handleExportPNG() {
        // Create a temporary canvas to draw a background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = window.canvas.width;
        tempCanvas.height = window.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set background color based on theme
        tempCtx.fillStyle = isDarkMode() ? '#0f172a' : '#f0f3f8';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the current canvas on top
        tempCtx.drawImage(window.canvas, 0, 0);

        // Trigger download
        const dataUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `diskmotion_${window.algorithmSelect.value}_sim.png`;
        link.href = dataUrl;
        link.click();
    }

    /**
     * Handles the "Export TXT" button click.
     */
    function handleExportTXT() {
        if (window.history.length <= 1) {
            showError('Please run a simulation before exporting.');
            return;
        }
        
        const inputs = parseInputs(false);
        const finalState = window.history[window.history.length - 1];
        
        let trace = `--- DiskMotion Scheduling Trace (${window.algorithmSelect.value.toUpperCase()}) ---\n\n`;
        trace += "1. INPUTS\n";
        let reqDisplay = (window.algorithmSelect.value === 'fcfs') ? reqInput.value : [...window.originalRequestSet].join(', ');
        trace += `   Request Sequence: ${reqDisplay}\n`;
        trace += `   Initial Head: ${inputs.startHead}\n`;
        if (['scan', 'c-scan', 'look', 'c-look'].includes(window.algorithmSelect.value)) {
            trace += `   Direction: ${inputs.direction}\n`;
        }
        trace += "\n";
        
        trace += "2. RESULTS\n";
        trace += `   Served Sequence: ${finalState.servedOrder.join(' -> ')}\n`;
        trace += `   Total Seek Time: ${finalState.seek}\n`;
        trace += `   Total Requests: ${window.originalRequestSet.size}\n`;
        trace += `   Average Seek Time: ${(finalState.seek / window.originalRequestSet.size).toFixed(2)}\n\n`;
        
        trace += "3. STEP-BY-STEP TRACE (Full Head Path)\n";
        let fullPath = window.history.map(s => s.head);
        trace += `   Full Path: ${fullPath.join(' -> ')}\n\n`;
        
        trace += "Step | Move To | Seek | Total Seek | Served Requests\n";
        trace += "-------------------------------------------------------\n";
        
        for (let i = 0; i < window.history.length; i++) {
            const state = window.history[i];
            const lastHead = (i === 0) ? state.head : window.history[i-1].head;
            const seek = (i === 0) ? 0 : Math.abs(state.head - lastHead);
            trace += `${i.toString().padEnd(4)} | ${state.head.toString().padEnd(7)} | ${seek.toString().padEnd(4)} | ${state.seek.toString().padEnd(10)} | ${[...state.served].sort((a,b)=>a-b).join(', ')}\n`;
        }

        // Trigger download
        const blob = new Blob([trace], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `diskmotion_${window.algorithmSelect.value}_trace.txt`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Handles the "Compare All" button click.
     */
    function handleCompareAll() {
        clearError();
        const inputs = parseInputs();
        if (!inputs) return;
        
        const algos = ['fcfs', 'sstf', 'scan', 'c-scan', 'look', 'c-look'];
        let results = [];

        for (const algo of algos) {
            // We must pass the *original* un-sorted, un-deduped list
            // to the stats function, as it handles FCFS vs. others.
            const rawRequests = reqInput.value.split(',')
                .map(s => parseInt(s.trim()))
                .filter(n => !isNaN(n) && n >= 0 && n <= window.DISK_MAX);

            // Get stats from algorithms.js
            const seek = getAlgorithmStats(algo, rawRequests, inputs.startHead, inputs.direction);
            results.push({ name: algo.toUpperCase(), seek: seek });
        }

        // Sort by seek time
        results.sort((a, b) => a.seek - b.seek);
        
        // Populate and show modal
        compareModalInputs.innerHTML = `
            <strong>Head:</strong> ${inputs.startHead} | 
            <strong>Direction:</strong> ${inputs.direction} | 
            <strong>Requests:</strong> ${inputs.requests.length}
        `;
        
        compareModalTableBody.innerHTML = ''; // Clear old results
        results.forEach((res, index) => {
            const isBest = (index === 0);
            const row = `
                <tr class="${isBest ? 'bg-green-100 dark:bg-green-800' : ''}">
                    <td class="p-2 ${isBest ? 'font-bold' : ''} text-gray-800 dark:text-gray-100">${res.name} ${isBest ? '🏆' : ''}</td>
                    <td class="p-2 ${isBest ? 'font-bold' : ''} text-gray-800 dark:text-gray-100">${res.seek}</td>
                </tr>
            `;
            compareModalTableBody.innerHTML += row;
        });
        
        compareModal.classList.remove('hidden');
    }

    // --- STARTUP ---
    init();
});

