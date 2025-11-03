[Uploading README.md…]()
# DiskMotion - Disk Scheduling Algorithm Visualizer

**Course:** BCSE303L - Operating Systems

## 1. Project Description

DiskMotion is a web-based, interactive animation tool that visualizes the behavior of core disk scheduling algorithms. It is built entirely with client-side technologies (HTML, CSS, JavaScript) and uses the HTML5 Canvas API for smooth, step-by-step animations.

This tool allows users to input a custom sequence of disk requests, set the initial head position, and select an algorithm to observe its real-time behavior. It is designed to be an educational aid for understanding the performance and logic of different scheduling strategies.

## 2. Feature Overview

* **Six Scheduling Algorithms:** Visualize and compare FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK.
* **Interactive Visualization:** A dynamic canvas shows the disk head (red), pending requests (blue), and served requests (green) moving in real-time.
* **Full Animation Control:**
    * **Play/Pause:** Start and stop the animation.
    * **Step Forward/Backward:** Move through the simulation one step at a time.
    * **Speed Control:** Adjust the animation speed from "Slowest" to "Fastest".
    * **Interactive Timeline:** A scrubber allows you to jump to any point in the animation.
    * **Reset:** Clears the simulation and restores all inputs.
* **Customizable Inputs:**
    * Enter a comma-separated list of disk requests (0-199).
    * Set the initial head position.
    * Select the initial direction for SCAN/LOOK algorithms.
    * **Random Input Generator:** Create a new set of random requests with a specified count.
* **"Compare All" Feature:** A powerful tool that runs all 6 algorithms on the current inputs and displays a summary table of their total seek times, highlighting the most efficient one.
* **Real-time Statistics:** The UI updates instantly to show:
    * Total Seek Time
    * Average Seek Time
    * The ordered sequence of served requests.
* **Data Export:**
    * **Export PNG:** Save a screenshot of the current visualization state.
    * **Export TXT:** Save a detailed trace of the entire simulation, including inputs, results, and a step-by-step head path.
* **Modern UI:**
    * Responsive, clean, and modern design.
    * Light and Dark mode support.

## 3. How to Execute

This application is a 100% client-side tool and has **zero server dependencies**.

1.  Download the complete source code package (`index.html`, `styles.css`, `algorithms.js`, `animation.js`, `app.js`).
2.  Ensure all five files are located in the **same folder**.
3.  Double-click the `index.html` file.
4.  The application will open and run locally in your default web browser.

## 4. System Requirements

* **Software:** A modern web browser.
* **Supported Browsers:**
    * Google Chrome (v80 or newer)
    * Mozilla Firefox (v78 or newer)
    * Microsoft Edge (v80 or newer)
    * Apple Safari (v14 or newer)
* **Dependencies:** An internet connection is required *only* to load the Tailwind CSS framework and the 'Inter' font from Google Fonts. The core application logic runs entirely locally.
