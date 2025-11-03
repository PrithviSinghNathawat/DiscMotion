/**
 * @file algorithms.js
 * * Contains all pure algorithm logic for disk scheduling.
 * - Part 1: Generates a step-by-step history for animation.
 * - Part 2: Provides "pure" calculations for the "Compare All" feature.
 * * This file has no dependencies on app.js or animation.js,
 * but app.js depends on this file.
 */

// ===================================================================
//
// Part 1: "Visual" functions that generate the global `history` array
// for the step-by-step animation.
//
// These functions are called by app.js and modify the global `history` array.
//
// ===================================================================

/**
 * Dispatches to the correct algorithm function based on UI selection.
 * @param {string} algorithm - The selected algorithm (e.g., 'fcfs', 'sstf').
 * @param {number[]} requests - The list of requests.
 * @param {number} startHead - The starting head position.
 * @param {string} direction - The starting direction ('left' or 'right').
 * @returns {boolean} True if history was successfully generated.
 */
function calculateSimulationHistory(algorithm, requests, startHead, direction) {
    // Clear previous history
    window.history = []; // Access global history from app.js
    window.currentStateIndex = 0;
    
    // Store the *original* set for FCFS, but a sorted set for others
    if (algorithm === 'fcfs') {
        window.originalRequestSet = new Set(requests);
    } else {
        window.originalRequestSet = new Set([...new Set(requests)].sort((a,b)=>a-b));
    }
    
    // The first step in history is always the start position
    addHistoryStep(startHead, 0, new Set(), []);

    switch (algorithm) {
        case 'fcfs':
            calculateFcfsPath(requests, startHead);
            break;
        case 'sstf':
            calculateSstfPath(requests, startHead);
            break;
        case 'scan':
            calculateScanPath(requests, startHead, direction);
            break;
        case 'c-scan':
            calculateCScanPath(requests, startHead, direction);
            break;
        case 'look':
            calculateLookPath(requests, startHead, direction);
            break;
        case 'c-look':
            calculateCLookPath(requests, startHead, direction);
            break;
    }
    
    // Add a final "dummy" state to show the last request as served
    if (window.history.length > 0) {
        window.history.push(window.history[window.history.length - 1]);
    }
    
    return true;
}

/**
 * Helper to add a step to the global history array.
 * @param {number} head - The current head position.
 * @param {number} seek - The total seek time up to this point.
 * @param {Set<number>} servedSet - A set of served request numbers.
 * @param {number[]} servedOrder - An array of served requests in order.
 */
function addHistoryStep(head, seek, servedSet, servedOrder) {
    window.history.push({
        head: head,
        seek: seek,
        served: new Set(servedSet),
        servedOrder: [...servedOrder]
    });
}

/**
 * Generates history for FCFS (First-Come, First-Served).
 * @param {number[]} requests - The *original order* list of requests.
 * @param {number} startHead - The starting head position.
 */
function calculateFcfsPath(requests, startHead) {
    let currentHead = startHead;
    let totalSeek = 0;
    let served = new Set();
    let servedOrder = [];

    for (const req of requests) {
        totalSeek += Math.abs(req - currentHead);
        currentHead = req;
        
        if (window.originalRequestSet.has(req)) {
            served.add(req);
            servedOrder.push(req);
        }
        addHistoryStep(currentHead, totalSeek, served, servedOrder);
    }
}

/**
 * Generates history for SSTF (Shortest Seek Time First).
 * @param {number[]} requests - The list of requests.
 * @param {number} startHead - The starting head position.
 */
function calculateSstfPath(requests, startHead) {
    let currentHead = startHead;
    let totalSeek = 0;
    let served = new Set();
    let servedOrder = [];
    
    let remaining = new Set(requests);
    if (remaining.has(startHead)) {
        remaining.delete(startHead);
        served.add(startHead);
        servedOrder.push(startHead);
        addHistoryStep(currentHead, totalSeek, served, servedOrder);
    }

    while (remaining.size > 0) {
        let shortestDist = Infinity;
        let nextReq = -1;

        for (const req of remaining) {
            const dist = Math.abs(req - currentHead);
            if (dist < shortestDist) {
                shortestDist = dist;
                nextReq = req;
            }
        }
        
        totalSeek += shortestDist;
        currentHead = nextReq;
        served.add(currentHead);
        servedOrder.push(currentHead);
        remaining.delete(currentHead);

        addHistoryStep(currentHead, totalSeek, served, servedOrder);
    }
}

/**
 * Generates history for SCAN (Elevator).
 * @param {number[]} requests - The list of requests.
 * @param {number} startHead - The starting head position.
 * @param {string} direction - The starting direction.
 */
function calculateScanPath(requests, startHead, direction) {
    let currentHead = startHead;
    let totalSeek = 0;
    let served = new Set();
    let servedOrder = [];

    let sortedRequests = [...new Set(requests)].sort((a,b)=>a-b);
    
    let leftRequests = sortedRequests.filter(r => r < startHead).reverse(); // Sort descending
    let rightRequests = sortedRequests.filter(r => r >= startHead); // Sort ascending

    if (sortedRequests.includes(startHead)) {
        served.add(startHead);
        servedOrder.push(startHead);
        addHistoryStep(currentHead, totalSeek, served, servedOrder);
    }

    if (direction === 'right') {
        for (const req of rightRequests) {
            if (req === startHead) continue;
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        if (currentHead !== window.DISK_MAX) {
            totalSeek += Math.abs(window.DISK_MAX - currentHead);
            currentHead = window.DISK_MAX;
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        for (const req of leftRequests) {
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
    } else { // direction === 'left'
        for (const req of leftRequests) {
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        if (currentHead !== 0) {
            totalSeek += Math.abs(0 - currentHead);
            currentHead = 0;
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        for (const req of rightRequests) {
            if (req === startHead) continue;
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
    }
}

/**
 * Generates history for C-SCAN (Circular SCAN).
 * @param {number[]} requests - The list of requests.
 * @param {number} startHead - The starting head position.
 * @param {string} direction - The starting direction.
 */
function calculateCScanPath(requests, startHead, direction) {
    let currentHead = startHead;
    let totalSeek = 0;
    let served = new Set();
    let servedOrder = [];

    let sortedRequests = [...new Set(requests)].sort((a,b)=>a-b);
    
    let leftRequests = sortedRequests.filter(r => r < startHead);
    let rightRequests = sortedRequests.filter(r => r >= startHead);

    if (sortedRequests.includes(startHead)) {
        served.add(startHead);
        servedOrder.push(startHead);
        addHistoryStep(currentHead, totalSeek, served, servedOrder);
    }
    
    if (direction === 'right') {
        for (const req of rightRequests) {
            if (req === startHead) continue;
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        if (currentHead !== window.DISK_MAX) {
            totalSeek += Math.abs(window.DISK_MAX - currentHead);
            currentHead = window.DISK_MAX;
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        totalSeek += window.DISK_MAX; // Add full sweep
        currentHead = 0;
        addHistoryStep(currentHead, totalSeek, served, servedOrder);
        for (const req of leftRequests) {
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
    } else { // direction === 'left'
        leftRequests.reverse(); // Serve in descending order
        for (const req of leftRequests) {
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        if (currentHead !== 0) {
            totalSeek += Math.abs(0 - currentHead);
            currentHead = 0;
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        totalSeek += window.DISK_MAX;
        currentHead = window.DISK_MAX;
        addHistoryStep(currentHead, totalSeek, served, servedOrder);
        
        rightRequests.reverse();
        for (const req of rightRequests) {
            if (req === startHead) continue;
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
    }
}

/**
 * Generates history for LOOK.
 * @param {number[]} requests - The list of requests.
 * @param {number} startHead - The starting head position.
 * @param {string} direction - The starting direction.
 */
function calculateLookPath(requests, startHead, direction) {
    let currentHead = startHead;
    let totalSeek = 0;
    let served = new Set();
    let servedOrder = [];

    let sortedRequests = [...new Set(requests)].sort((a,b)=>a-b);
    
    let leftRequests = sortedRequests.filter(r => r < startHead).reverse(); // Sort descending
    let rightRequests = sortedRequests.filter(r => r >= startHead); // Sort ascending

    if (sortedRequests.includes(startHead)) {
        served.add(startHead);
        servedOrder.push(startHead);
        addHistoryStep(currentHead, totalSeek, served, servedOrder);
    }

    if (direction === 'right') {
        for (const req of rightRequests) {
            if (req === startHead) continue;
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        for (const req of leftRequests) {
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
    } else { // direction === 'left'
        for (const req of leftRequests) {
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        for (const req of rightRequests) {
            if (req === startHead) continue;
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
    }
}

/**
 * Generates history for C-LOOK.
 * @param {number[]} requests - The list of requests.
 * @param {number} startHead - The starting head position.
 * @param {string} direction - The starting direction.
 */
function calculateCLookPath(requests, startHead, direction) {
    let currentHead = startHead;
    let totalSeek = 0;
    let served = new Set();
    let servedOrder = [];

    let sortedRequests = [...new Set(requests)].sort((a,b)=>a-b);
    
    let leftRequests = sortedRequests.filter(r => r < startHead);
    let rightRequests = sortedRequests.filter(r => r >= startHead);

    if (sortedRequests.includes(startHead)) {
        served.add(startHead);
        servedOrder.push(startHead);
        addHistoryStep(currentHead, totalSeek, served, servedOrder);
    }
    
    if (direction === 'right') {
        for (const req of rightRequests) {
            if (req === startHead) continue;
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        if (leftRequests.length > 0) {
            const firstReq = leftRequests[0];
            totalSeek += Math.abs(firstReq - currentHead); // Jump
            currentHead = firstReq;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
            
            for (let i = 1; i < leftRequests.length; i++) {
                const req = leftRequests[i];
                totalSeek += Math.abs(req - currentHead);
                currentHead = req;
                served.add(currentHead);
                servedOrder.push(currentHead);
                addHistoryStep(currentHead, totalSeek, served, servedOrder);
            }
        }
    } else { // direction === 'left'
        leftRequests.reverse(); // Serve in descending order
        for (const req of leftRequests) {
            totalSeek += Math.abs(req - currentHead);
            currentHead = req;
            served.add(currentHead);
            servedOrder.push(currentHead);
            addHistoryStep(currentHead, totalSeek, served, servedOrder);
        }
        if (rightRequests.length > 0) {
            const lastReq = rightRequests[rightRequests.length - 1];
            totalSeek += Math.abs(lastReq - currentHead); // Jump
            currentHead = lastReq;
            if (currentHead !== startHead) {
               served.add(currentHead);
               servedOrder.push(currentHead);
               addHistoryStep(currentHead, totalSeek, served, servedOrder);
            }

            for (let i = rightRequests.length - 2; i >= 0; i--) {
                const req = rightRequests[i];
                if (req === startHead) continue;
                totalSeek += Math.abs(req - currentHead);
                currentHead = req;
                served.add(currentHead);
                servedOrder.push(currentHead);
                addHistoryStep(currentHead, totalSeek, served, servedOrder);
            }
        }
    }
}


// ===================================================================
//
// Part 2: "Pure" functions for the "Compare All" modal.
//
// These functions are self-contained, do not modify global state,
// and simply return the total seek time.
//
// ===================================================================

/**
 * Gets the total seek time for a given algorithm.
 * This is a "pure" calculation for the "Compare All" feature.
 * @param {string} algo - The algorithm name (e.g., 'fcfs').
 * @param {number[]} requests - The *original* list of requests.
 * @param {number} startHead - The starting head position.
 * @param {string} direction - The starting direction.
 * @returns {number} The total seek time.
 */
function getAlgorithmStats(algo, requests, startHead, direction) {
    // FCFS is the only one that uses the un-sorted, un-deduped list
    let reqCopy = (algo === 'fcfs') ? [...requests] : [...new Set(requests)];
    let headCopy = startHead;
    let dirCopy = direction;
    const diskMax = window.DISK_MAX || 199; // Use global or default
    
    let totalSeek = 0;
    
    switch (algo) {
        case 'fcfs':
            for (const req of reqCopy) {
                totalSeek += Math.abs(req - headCopy);
                headCopy = req;
            }
            break;
        
        case 'sstf':
            let remaining = new Set(reqCopy);
            if (remaining.has(headCopy)) {
                remaining.delete(headCopy);
            }
            while (remaining.size > 0) {
                let shortestDist = Infinity;
                let nextReq = -1;
                for (const req of remaining) {
                    const dist = Math.abs(req - headCopy);
                    if (dist < shortestDist) {
                        shortestDist = dist;
                        nextReq = req;
                    }
                }
                totalSeek += shortestDist;
                headCopy = nextReq;
                remaining.delete(headCopy);
            }
            break;
        
        case 'scan':
            reqCopy.sort((a,b)=>a-b);
            let left = reqCopy.filter(r => r < headCopy);
            let right = reqCopy.filter(r => r >= headCopy);
            
            if (dirCopy === 'right') {
                if (right.length > 0) {
                    totalSeek += Math.abs(right[right.length - 1] - headCopy);
                    headCopy = right[right.length - 1];
                }
                totalSeek += Math.abs(diskMax - headCopy);
                headCopy = diskMax;
                if (left.length > 0) {
                    totalSeek += Math.abs(left[0] - headCopy);
                }
            } else { // left
                if (left.length > 0) {
                    totalSeek += Math.abs(left[0] - headCopy);
                    headCopy = left[0];
                }
                totalSeek += Math.abs(0 - headCopy);
                headCopy = 0;
                if (right.length > 0) {
                    totalSeek += Math.abs(right[right.length - 1] - headCopy);
                }
            }
            break;
        
        case 'c-scan':
            reqCopy.sort((a,b)=>a-b);
            let c_left = reqCopy.filter(r => r < headCopy);
            let c_right = reqCopy.filter(r => r >= headCopy);
            
            if (dirCopy === 'right') {
                if (c_right.length > 0) {
                    totalSeek += Math.abs(c_right[c_right.length - 1] - headCopy);
                    headCopy = c_right[c_right.length - 1];
                }
                totalSeek += Math.abs(diskMax - headCopy);
                totalSeek += diskMax; // Jump
                headCopy = 0;
                if (c_left.length > 0) {
                    totalSeek += Math.abs(c_left[c_left.length - 1] - headCopy);
                }
            } else { // left
                 if (c_left.length > 0) {
                    totalSeek += Math.abs(c_left[0] - headCopy);
                    headCopy = c_left[0];
                }
                totalSeek += Math.abs(0 - headCopy);
                totalSeek += diskMax; // Jump
                headCopy = diskMax;
                if (c_right.length > 0) {
                    totalSeek += Math.abs(c_right[0] - headCopy);
                }
            }
            break;

        case 'look':
            reqCopy.sort((a,b)=>a-b);
            let l_left = reqCopy.filter(r => r < headCopy);
            let l_right = reqCopy.filter(r => r >= headCopy);
            
            if (dirCopy === 'right') {
                if (l_right.length > 0) {
                    totalSeek += Math.abs(l_right[l_right.length - 1] - headCopy);
                    headCopy = l_right[l_right.length - 1];
                }
                if (l_left.length > 0) {
                    totalSeek += Math.abs(l_left[0] - headCopy);
                }
            } else { // left
                if (l_left.length > 0) {
                    totalSeek += Math.abs(l_left[0] - headCopy);
                    headCopy = l_left[0];
                }
                if (l_right.length > 0) {
                    totalSeek += Math.abs(l_right[l_right.length - 1] - headCopy);
                }
            }
            break;
        
        case 'c-look':
            reqCopy.sort((a,b)=>a-b);
            let cl_left = reqCopy.filter(r => r < headCopy);
            let cl_right = reqCopy.filter(r => r >= headCopy);
            
            if (dirCopy === 'right') {
                if (cl_right.length > 0) {
                    totalSeek += Math.abs(cl_right[cl_right.length - 1] - headCopy);
                    headCopy = cl_right[cl_right.length - 1];
                }
                if (cl_left.length > 0) {
                    totalSeek += Math.abs(cl_left[0] - headCopy); // Jump
                    totalSeek += Math.abs(cl_left[cl_left.length - 1] - cl_left[0]);
                }
            } else { // left
                if (cl_left.length > 0) {
                    totalSeek += Math.abs(cl_left[0] - headCopy);
                    headCopy = cl_left[0];
                }
                if (cl_right.length > 0) {
                    totalSeek += Math.abs(cl_right[cl_right.length - 1] - headCopy); // Jump
                    totalSeek += Math.abs(cl_right[0] - cl_right[cl_right.length - 1]);
                }
            }
            break;
    }
    return totalSeek;
}

