/**
 * @file animation.js
 * * Contains all Canvas drawing and animation logic.
 * This file depends on DOM element IDs from index.html
 * and global variables defined in app.js.
 */

/**
 * Resizes the canvas to fit its container.
 * This function is called on init and window resize.
 */
function resizeCanvas() {
    window.canvas.width = window.canvas.parentElement.clientWidth;
    window.canvas.height = 150;
}

/**
 * Main drawing function. Renders the current state to the canvas.
 * This function reads the global state (history, currentStateIndex)
 * and draws the corresponding frame.
 */
function draw() {
    const ctx = window.ctx;
    ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);
    
    const canvasWidth = window.canvas.width;
    const dark = isDarkMode(); // isDarkMode is defined in app.js
    
    // Get theme-aware colors
    const trackColor = dark ? '#475569' : '#d1d5db';
    const textColor = dark ? '#e2e8f0' : '#1f2937';

    // Helper to scale disk position to canvas position
    const scaleX = (pos) => window.PADDING + (pos / window.DISK_MAX) * (canvasWidth - 2 * window.PADDING);

    // --- Draw Track ---
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(scaleX(0), window.HEAD_Y);
    ctx.lineTo(scaleX(window.DISK_MAX), window.HEAD_Y);
    ctx.stroke();

    // Draw track ends
    ctx.beginPath();
    ctx.moveTo(scaleX(0), window.HEAD_Y - 10);
    ctx.lineTo(scaleX(0), window.HEAD_Y + 10);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(scaleX(window.DISK_MAX), window.HEAD_Y - 10);
    ctx.lineTo(scaleX(window.DISK_MAX), window.HEAD_Y + 10);
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = textColor;
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('0', scaleX(0), window.HEAD_Y + 30);
    ctx.fillText(window.DISK_MAX.toString(), scaleX(window.DISK_MAX), window.HEAD_Y + 30);
    
    // --- If simulation hasn't started, just draw inputs ---
    if (window.history.length === 0) {
        const inputs = parseInputs(false); // parseInputs is defined in app.js
        if (inputs) {
            let requestsToDraw = (window.algorithmSelect.value === 'fcfs') ? inputs.requests : [...new Set(inputs.requests)];
            requestsToDraw.forEach(req => {
                drawPoint(scaleX(req), window.REQUEST_Y, window.COLORS.pending, req, textColor);
            });
            drawHead(scaleX(inputs.startHead), window.HEAD_Y, window.COLORS.head, inputs.startHead, textColor);
        }
        return; // Exit draw function
    }

    // --- Draw state from history ---
    const { head, served } = window.history[window.currentStateIndex];

    // Draw all original requests
    window.originalRequestSet.forEach(req => {
        const color = served.has(req) ? window.COLORS.served : window.COLORS.pending;
        drawPoint(scaleX(req), window.REQUEST_Y, color, req, textColor);
    });

    // Draw the head
    drawHead(scaleX(head), window.HEAD_Y, window.COLORS.head, head, textColor);
}

/**
 * Helper to draw a request point on the canvas.
 * @param {number} x - The x-coordinate.
 * @param {number} y - The y-coordinate.
 * @param {string} color - The fill color.
 * @param {string} text - The request number to display.
 * @param {string} textColor - The color for the text label.
 */
function drawPoint(x, y, color, text, textColor) {
    const ctx = window.ctx;
    ctx.beginPath();
    ctx.arc(x, y, window.POINT_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.fillStyle = textColor;
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + window.POINT_RADIUS + 14);
}

/**
 * Helper to draw the disk head on the canvas.
 * @param {number} x - The x-coordinate.
 * @param {number} y - The y-coordinate.
 * @param {string} color - The fill color.
 * @param {string} text - The head position number to display.
 * @param {string} textColor - The color for the text label.
 */
function drawHead(x, y, color, text, textColor) {
    const ctx = window.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - window.POINT_RADIUS, y - (window.POINT_RADIUS * 1.5));
    ctx.lineTo(x + window.POINT_RADIUS, y - (window.POINT_RADIUS * 1.5));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - (window.POINT_RADIUS * 2));
}

