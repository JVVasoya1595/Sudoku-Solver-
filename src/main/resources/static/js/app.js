// State Variables
let currentMode = 'solver'; // 'solver' or 'game'
let gameSolution = null;
let lifelines = 3;
let hints = 3;
let gameActive = false;

// Theme + Timer
const THEME_STORAGE_KEY = 'sudoku_theme';
let gameTimerIntervalId = null;
let gameTimerStartMs = 0;
let gameElapsedMs = 0;

// GSAP Animations
let reduceMotion = false;
let messageHideTimeoutId = null;
let activeConfirmResolve = null;
let activeConfirmClose = null;
let lastFocusedElementBeforeModal = null;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initializeBoard();
    setupEventListeners();
    initializeTheme();
    resetGameTimer();
    initializeAnimations();
    loadDefaultPuzzle();
});

function openConfirmModal({ title = 'Confirm', message = 'Are you sure?', confirmText = 'OK', cancelText = 'Cancel', confirmVariantClass = 'btn-warning' } = {}) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modalOverlay');
        const titleEl = document.getElementById('modalTitle');
        const messageEl = document.getElementById('modalMessage');
        const cancelBtn = document.getElementById('modalCancelBtn');
        const confirmBtn = document.getElementById('modalConfirmBtn');

        if (!overlay || !titleEl || !messageEl || !cancelBtn || !confirmBtn) {
            // Fallback (should not happen)
            resolve(window.confirm(message));
            return;
        }

        if (activeConfirmResolve) {
            // If a modal is already open, close it as cancelled.
            if (typeof activeConfirmClose === 'function') activeConfirmClose(false);
        }

        lastFocusedElementBeforeModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;

        titleEl.textContent = title;
        messageEl.textContent = message;
        cancelBtn.textContent = cancelText;
        confirmBtn.textContent = confirmText;

        confirmBtn.className = 'btn ' + (confirmVariantClass || 'btn-warning');

        overlay.classList.remove('hidden');
        activeConfirmResolve = resolve;
        activeConfirmClose = null;

        const modal = overlay.querySelector('.modal');

        const cleanup = () => {
            overlay.removeEventListener('click', onOverlayClick);
            cancelBtn.removeEventListener('click', onCancelClick);
            confirmBtn.removeEventListener('click', onConfirmClick);
            document.removeEventListener('keydown', onKeyDown, true);
        };

        const finishAndResolve = (result) => {
            overlay.classList.add('hidden');
            overlay.style.opacity = '';
            if (modal) {
                modal.style.opacity = '';
                modal.style.transform = '';
            }
            if (lastFocusedElementBeforeModal) lastFocusedElementBeforeModal.focus();
            lastFocusedElementBeforeModal = null;
            resolve(result);
        };

        const close = (result) => {
            cleanup();
            activeConfirmResolve = null;
            activeConfirmClose = null;
            if (gsapEnabled() && modal) {
                window.gsap.to(overlay, { opacity: 0, duration: 0.12, ease: 'power1.in' });
                window.gsap.to(modal, { y: 8, scale: 0.985, duration: 0.12, ease: 'power1.in', onComplete: () => finishAndResolve(result) });
                return;
            }
            finishAndResolve(result);
        };
        activeConfirmClose = close;

        const onOverlayClick = (e) => {
            if (e.target === overlay) close(false);
        };

        const onCancelClick = () => close(false);
        const onConfirmClick = () => close(true);
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close(false);
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                close(true);
            }
        };

        overlay.addEventListener('click', onOverlayClick);
        cancelBtn.addEventListener('click', onCancelClick);
        confirmBtn.addEventListener('click', onConfirmClick);
        document.addEventListener('keydown', onKeyDown, true);

        if (gsapEnabled() && modal) {
            window.gsap.set(overlay, { opacity: 0 });
            window.gsap.set(modal, { y: 10, scale: 0.985 });
            window.gsap.to(overlay, { opacity: 1, duration: 0.16, ease: 'power1.out' });
            window.gsap.to(modal, { y: 0, scale: 1, duration: 0.18, ease: 'power2.out' });
        }

        // Focus confirm button by default
        setTimeout(() => confirmBtn.focus(), 0);
    });
}

function setGameControlsEnabled(enabled) {
    const hintBtn = document.getElementById('hintBtn');
    const giveUpBtn = document.getElementById('giveUpBtn');
    if (hintBtn) hintBtn.disabled = !enabled;
    if (giveUpBtn) giveUpBtn.disabled = !enabled;
}

function lockBoardInputs(addReadonlyClass = false) {
    document.querySelectorAll('.sudoku-board input').forEach(input => {
        input.setAttribute('readonly', 'true');
        if (addReadonlyClass) input.classList.add('readonly-cell');
    });
}

function terminateGame({ message, type = 'info', lockBoard = true, addReadonlyClass = false, revealSolution = false } = {}) {
    gameActive = false;
    stopGameTimer();
    setGameControlsEnabled(false);

    if (revealSolution && gameSolution) {
        setBoardToUI(gameSolution, true);
    } else if (lockBoard) {
        lockBoardInputs(addReadonlyClass);
    }

    if (message) showMessage(message, type);
}

function getCsrfHeaders() {
    const token = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
    const headerName = document.querySelector('meta[name="_csrf_header"]')?.getAttribute('content');
    if (!token || !headerName) return {};
    return { [headerName]: token };
}

function apiFetch(url, options = {}) {
    const baseHeaders = options.headers ? { ...options.headers } : {};
    const headers = { ...baseHeaders, ...getCsrfHeaders() };
    return fetch(url, { ...options, headers });
}

function gsapEnabled() {
    return !reduceMotion && typeof window.gsap !== 'undefined';
}

function initializeAnimations() {
    if (!gsapEnabled()) return;

    const container = document.querySelector('.container');
    const title = document.querySelector('h1.glitch-title');
    const subtitle = document.querySelector('.subtitle');
    const modeButtons = document.querySelectorAll('.mode-switcher .btn');
    const board = document.querySelector('.board-container');
    const controls = document.querySelectorAll('#solverModeControls, #gameModeControls');
    const info = document.querySelector('.info-section');
    const toggle = document.getElementById('themeToggleBtn');

    window.gsap.set([toggle, title, subtitle, modeButtons, board, controls, info], { opacity: 1 });
    window.gsap.set(container, { opacity: 0, y: 14, scale: 0.985 });

    const tl = window.gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.to(container, { opacity: 1, y: 0, scale: 1, duration: 0.45 })
        .from([toggle, title], { opacity: 0, y: -8, duration: 0.35, stagger: 0.06 }, '-=0.20')
        .from(subtitle, { opacity: 0, y: -6, duration: 0.25 }, '-=0.25')
        .from(modeButtons, { opacity: 0, y: -6, duration: 0.22, stagger: 0.06 }, '-=0.20')
        .from(board, { opacity: 0, y: 10, duration: 0.30 }, '-=0.18')
        .from(controls, { opacity: 0, y: 10, duration: 0.25 }, '-=0.18')
        .from(info, { opacity: 0, y: 10, duration: 0.25 }, '-=0.18');
}

// Initialize the board with input fields
function initializeBoard() {
    const inputs = document.querySelectorAll('.sudoku-board input');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            // Only allow numbers 1-9 or empty
            if (this.value && (this.value < 1 || this.value > 9)) {
                this.value = '';
                return;
            }

            // If in Game Mode and active, check against solution
            if (currentMode === 'game' && gameActive && this.value) {
                const r = parseInt(this.getAttribute('data-row'));
                const c = parseInt(this.getAttribute('data-col'));
                const val = parseInt(this.value);

                this.classList.remove('wrong', 'correct');

                if (val === gameSolution[r][c]) {
                    this.classList.add('correct');
                    this.setAttribute('readonly', 'true');
                    this.classList.add('readonly-cell');
                    animateCellCorrect(this);
                    checkWinCondition();
                } else {
                    this.classList.add('wrong');
                    animateCellWrong(this);
                    deductLifeline();
                    setTimeout(() => {
                        this.value = '';
                        this.classList.remove('wrong');
                    }, 800);
                }
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                navigateBoard(this, e.key);
                e.preventDefault();
            }
        });
    });
}

// Navigate board with arrow keys
function navigateBoard(input, direction) {
    const row = parseInt(input.getAttribute('data-row'));
    const col = parseInt(input.getAttribute('data-col'));
    let newRow = row;
    let newCol = col;

    switch (direction) {
        case 'ArrowUp': newRow = row === 0 ? 8 : row - 1; break;
        case 'ArrowDown': newRow = row === 8 ? 0 : row + 1; break;
        case 'ArrowLeft': newCol = col === 0 ? 8 : col - 1; break;
        case 'ArrowRight': newCol = col === 8 ? 0 : col + 1; break;
    }

    const nextInput = document.querySelector(`input[data-row="${newRow}"][data-col="${newCol}"]`);
    if (nextInput) nextInput.focus();
}

// Setup event listeners for buttons
function setupEventListeners() {
    // Mode Switching
    document.getElementById('modeSolveBtn').addEventListener('click', () => switchMode('solver'));
    document.getElementById('modeGameBtn').addEventListener('click', () => switchMode('game'));
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // Solver Mode Controls
    document.getElementById('solveBtn').addEventListener('click', solvePuzzle);
    document.getElementById('resetBtn').addEventListener('click', resetPuzzle);
    document.getElementById('clearBtn').addEventListener('click', clearBoard);
    document.getElementById('validateBtn').addEventListener('click', validatePuzzle);
    document.getElementById('loadMatrixBtn').addEventListener('click', loadMatrixFromInput);

    // Game Mode Controls
    document.getElementById('startGameBtn').addEventListener('click', startNewGame);
    document.getElementById('hintBtn').addEventListener('click', provideHint);
    document.getElementById('giveUpBtn').addEventListener('click', giveUpGame);
}

function switchMode(mode) {
    currentMode = mode;
    animateModeSwitchOut();
    clearBoardAction(); // Clear without prompt

    document.getElementById('modeSolveBtn').classList.toggle('active', mode === 'solver');
    document.getElementById('modeGameBtn').classList.toggle('active', mode === 'game');

    document.getElementById('solverModeControls').classList.toggle('hidden', mode !== 'solver');
    document.getElementById('solverMatrixInput').classList.toggle('hidden', mode !== 'solver');
    document.getElementById('solverInstructions').classList.toggle('hidden', mode !== 'solver');

    document.getElementById('gameModeControls').classList.toggle('hidden', mode !== 'game');
    document.getElementById('gameStats').classList.toggle('hidden', mode !== 'game');
    document.getElementById('gameInstructions').classList.toggle('hidden', mode !== 'game');

    if (mode === 'solver') {
        gameActive = false;
        stopGameTimer();
        resetGameTimer();
        setGameControlsEnabled(false);
        loadDefaultPuzzle();
        showMessage('Switched to Solver mode.', 'info');
    } else {
        stopGameTimer();
        resetGameTimer();
        setGameControlsEnabled(gameActive);
        showMessage('Switched to Game mode. Press “New Game” to start.', 'info');
    }

    animateModeSwitchIn(mode);
}

function animateCellCorrect(inputEl) {
    if (!gsapEnabled()) return;
    window.gsap.killTweensOf(inputEl);
    window.gsap.fromTo(inputEl, { scale: 1 }, { scale: 1.06, duration: 0.10, yoyo: true, repeat: 1, ease: 'power1.out' });
}

function animateCellWrong(inputEl) {
    if (!gsapEnabled()) return;
    window.gsap.killTweensOf(inputEl);
    window.gsap.fromTo(inputEl, { x: 0 }, { x: -4, duration: 0.05, yoyo: true, repeat: 5, ease: 'power1.inOut' });
}

function animateModeSwitchOut() {
    if (!gsapEnabled()) return;
    const stats = document.getElementById('gameStats');
    const solverControls = document.getElementById('solverModeControls');
    const gameControls = document.getElementById('gameModeControls');
    const solverMatrix = document.getElementById('solverMatrixInput');
    const solverInstructions = document.getElementById('solverInstructions');
    const gameInstructions = document.getElementById('gameInstructions');

    const targets = [stats, solverControls, gameControls, solverMatrix, solverInstructions, gameInstructions].filter(Boolean);
    window.gsap.killTweensOf(targets);
    window.gsap.to(targets, { opacity: 0, y: -6, duration: 0.14, ease: 'power1.out' });
}

function animateModeSwitchIn(mode) {
    if (!gsapEnabled()) return;

    const stats = document.getElementById('gameStats');
    const solverControls = document.getElementById('solverModeControls');
    const gameControls = document.getElementById('gameModeControls');
    const solverMatrix = document.getElementById('solverMatrixInput');
    const solverInstructions = document.getElementById('solverInstructions');
    const gameInstructions = document.getElementById('gameInstructions');

    const incoming = [];
    if (mode === 'solver') {
        incoming.push(solverControls, solverMatrix, solverInstructions);
    } else {
        incoming.push(gameControls, stats, gameInstructions);
    }

    const targets = incoming.filter(el => el && !el.classList.contains('hidden'));
    window.gsap.killTweensOf(targets);
    window.gsap.fromTo(
        targets,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out', stagger: 0.05 }
    );

    const cells = document.querySelectorAll('.sudoku-board input');
    window.gsap.killTweensOf(cells);
    window.gsap.fromTo(cells, { opacity: 0.85 }, { opacity: 1, duration: 0.18, stagger: 0.003 });
}

// ------------------------------------
// THEME
// ------------------------------------

function initializeTheme() {
    let theme = localStorage.getItem(THEME_STORAGE_KEY);
    if (!theme) {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
    }
    applyTheme(theme);
}

function applyTheme(theme) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', normalized);
    localStorage.setItem(THEME_STORAGE_KEY, normalized);
    updateThemeToggleLabel();
    animateThemeChange();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
}

function updateThemeToggleLabel() {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    btn.textContent = current === 'dark' ? 'Dark' : 'Light';
}

function animateThemeChange() {
    if (!gsapEnabled()) return;
    const container = document.querySelector('.container');
    if (!container) return;
    window.gsap.killTweensOf(container);
    window.gsap.fromTo(container, { scale: 0.995 }, { scale: 1, duration: 0.18, ease: 'power1.out' });
}

// ------------------------------------
// GAME TIMER
// ------------------------------------

function pad2(num) {
    return String(num).padStart(2, '0');
}

function formatElapsedTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
    return `${pad2(minutes)}:${pad2(seconds)}`;
}

function setTimerDisplay(ms) {
    const el = document.getElementById('timerDisplay');
    if (!el) return;
    el.textContent = formatElapsedTime(ms);
}

function resetGameTimer() {
    gameElapsedMs = 0;
    gameTimerStartMs = 0;
    if (gameTimerIntervalId !== null) {
        clearInterval(gameTimerIntervalId);
        gameTimerIntervalId = null;
    }
    setTimerDisplay(0);
}

function startGameTimer() {
    if (gameTimerIntervalId !== null) clearInterval(gameTimerIntervalId);
    gameTimerStartMs = Date.now();
    gameTimerIntervalId = setInterval(() => {
        gameElapsedMs = Date.now() - gameTimerStartMs;
        setTimerDisplay(gameElapsedMs);
    }, 250);
}

function stopGameTimer() {
    if (gameTimerIntervalId === null) return;
    clearInterval(gameTimerIntervalId);
    gameTimerIntervalId = null;
    gameElapsedMs = Date.now() - gameTimerStartMs;
    setTimerDisplay(gameElapsedMs);
}

// Get current board state from UI
function getBoardFromUI() {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    document.querySelectorAll('.sudoku-board input').forEach(input => {
        const row = parseInt(input.getAttribute('data-row'));
        const col = parseInt(input.getAttribute('data-col'));
        board[row][col] = input.value ? parseInt(input.value) : 0;
    });
    return board;
}

// Set board state to UI
function setBoardToUI(board, lockCells = false) {
    document.querySelectorAll('.sudoku-board input').forEach(input => {
        const row = parseInt(input.getAttribute('data-row'));
        const col = parseInt(input.getAttribute('data-col'));
        const value = board[row][col];

        input.value = value === 0 ? '' : value;
        input.className = '';
        input.removeAttribute('readonly');

        if (value !== 0 && lockCells) {
            input.setAttribute('readonly', 'true');
            input.classList.add('readonly-cell');
        }
    });
}

// ------------------------------------
// SOLVER MODE FUNCTIONS (Backend API)
// ------------------------------------

function solvePuzzle() {
    apiFetch('/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getBoardFromUI())
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                setBoardToUI(data.board);
                showMessage('Solved!', 'success');
            } else {
                showMessage(data.message, 'error');
            }
        }).catch(e => showMessage('Network error. Please try again.', 'error'));
}

function resetPuzzle() {
    apiFetch('/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                setBoardToUI(data.board);
                showMessage('Reset complete.', 'success');
            }
        });
}

function clearBoard() {
    openConfirmModal({
        title: 'Clear board?',
        message: 'This will remove all numbers from the grid.',
        confirmText: 'Clear',
        cancelText: 'Cancel',
        confirmVariantClass: 'btn-warning'
    }).then((ok) => {
        if (ok) clearBoardAction();
    });
}

function clearBoardAction() {
    const inputs = document.querySelectorAll('.sudoku-board input');
    inputs.forEach(input => {
        input.value = '';
        input.className = '';
        input.removeAttribute('readonly');
    });
    gameActive = false;
    if (currentMode === 'game') {
        stopGameTimer();
        resetGameTimer();
        setGameControlsEnabled(false);
    }
}

function validatePuzzle() {
    apiFetch('/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getBoardFromUI())
    })
        .then(r => r.json())
        .then(data => {
            showMessage(data.message, data.valid ? 'success' : 'error');
        });
}

function loadMatrixFromInput() {
    const input = document.getElementById('matrixInput').value;
    if (!input.trim()) return showMessage('Paste a 9×9 grid first.', 'error');
    const numbers = input.match(/\d/g);
    if (!numbers || numbers.length < 81) return showMessage('Invalid grid. Need 81 digits (0–9).', 'error');

    const board = [];
    for (let i = 0; i < 9; i++) {
        const row = [];
        for (let j = 0; j < 9; j++) row.push(parseInt(numbers[i * 9 + j]));
        board.push(row);
    }
    setBoardToUI(board);
    showMessage('Grid loaded.', 'success');
}

// ------------------------------------
// GAME MODE FUNCTIONS (Frontend Generation)
// ------------------------------------

function startNewGame() {
    const difficultyMap = { 'easy': 30, 'medium': 40, 'hard': 50, 'expert': 60 };
    const diffNode = document.getElementById('difficultySelect').value;
    const blanks = difficultyMap[diffNode] || 40;

    let fullBoard = generateFullBoard();
    gameSolution = JSON.parse(JSON.stringify(fullBoard));

    let gameBoard = JSON.parse(JSON.stringify(fullBoard));
    removeKDigits(gameBoard, blanks);

    setBoardToUI(gameBoard, true);

    lifelines = 3;
    hints = 3;
    gameActive = true;
    updateGameStats();
    resetGameTimer();
    startGameTimer();
    setGameControlsEnabled(true);
    animateGameStart();

    showMessage(`New puzzle: ${diffNode.toUpperCase()}.`, 'info');
}

function animateGameStart() {
    if (!gsapEnabled()) return;
    const stats = document.getElementById('gameStats');
    const cells = document.querySelectorAll('.sudoku-board input');
    window.gsap.killTweensOf([stats, cells]);
    if (stats && !stats.classList.contains('hidden')) {
        window.gsap.fromTo(stats, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.20, ease: 'power2.out' });
    }
    window.gsap.fromTo(cells, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out', stagger: 0.004 });
}

function updateGameStats() {
    const hearts = ['💥', '❤', '❤❤', '❤❤❤'];
    document.getElementById('lifelinesDisplay').textContent = hearts[lifelines];
    document.getElementById('hintsDisplay').textContent = hints;
}

function deductLifeline() {
    lifelines--;
    updateGameStats();
    if (lifelines <= 0) {
        terminateGame({ message: 'Game over. No lives remaining.', type: 'error', lockBoard: true });
    } else {
        showMessage('Incorrect entry. Life lost.', 'warning');
    }
}

function provideHint() {
    if (!gameActive) return showMessage('Start a game first.', 'error');
    if (hints <= 0) return showMessage('No hints remaining.', 'error');

    const inputs = document.querySelectorAll('.sudoku-board input');
    const emptyInputs = Array.from(inputs).filter(input => !input.value);

    if (emptyInputs.length === 0) return;

    // Pick random empty cell
    const randomInput = emptyInputs[Math.floor(Math.random() * emptyInputs.length)];
    const r = parseInt(randomInput.getAttribute('data-row'));
    const c = parseInt(randomInput.getAttribute('data-col'));

    randomInput.value = gameSolution[r][c];
    randomInput.classList.add('correct', 'readonly-cell');
    randomInput.setAttribute('readonly', 'true');

    hints--;
    updateGameStats();
    checkWinCondition();
}

function giveUpGame() {
    if (!gameActive) return showMessage('No active game to give up.', 'error');
    if (!gameSolution) return showMessage('No solution available. Start a new game first.', 'error');
    openConfirmModal({
        title: 'Give up game?',
        message: 'This will end the game and reveal the solution.',
        confirmText: 'Give up',
        cancelText: 'Keep playing',
        confirmVariantClass: 'btn-warning'
    }).then((ok) => {
        if (!ok) return showMessage('Continuing game.', 'info');
        terminateGame({ message: `Showing solution. Time: ${formatElapsedTime(gameElapsedMs)}`, type: 'info', revealSolution: true });
    });
}

function checkWinCondition() {
    const inputs = document.querySelectorAll('.sudoku-board input');
    const allFilled = Array.from(inputs).every(input => input.value !== '');

    if (allFilled && gameActive) {
        terminateGame({ message: `Solved! Time: ${formatElapsedTime(gameElapsedMs)}`, type: 'success', lockBoard: true });
        document.querySelectorAll('.sudoku-board input').forEach(i => {
            i.classList.remove('correct', 'wrong');
            i.classList.add('completed');
        });
    }
}

// --- JS Sudoku Generator Helper ---

function generateFullBoard() {
    const board = Array(9).fill().map(() => Array(9).fill(0));
    fillDiagonal(board);
    solveSudokuJS(board);
    return board;
}

function fillDiagonal(board) {
    for (let i = 0; i < 9; i += 3) {
        fillBox(board, i, i);
    }
}

function fillBox(board, rowStart, colStart) {
    let num;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            do {
                num = Math.floor(Math.random() * 9) + 1;
            } while (!checkIfSafeInBox(board, rowStart, colStart, num));
            board[rowStart + i][colStart + j] = num;
        }
    }
}

function checkIfSafeInBox(board, rowStart, colStart, num) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[rowStart + i][colStart + j] === num) return false;
        }
    }
    return true;
}

function isSafe(board, row, col, num) {
    for (let d = 0; d < 9; d++) {
        if (board[row][d] === num || board[d][col] === num) return false;
    }
    return checkIfSafeInBox(board, row - row % 3, col - col % 3, num);
}

function solveSudokuJS(board) {
    let row = -1, col = -1, isEmpty = false;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === 0) {
                row = i; col = j; isEmpty = true; break;
            }
        }
        if (isEmpty) break;
    }
    if (!isEmpty) return true;
    for (let i = 1; i <= 9; i++) {
        if (isSafe(board, row, col, i)) {
            board[row][col] = i;
            if (solveSudokuJS(board)) return true;
            board[row][col] = 0;
        }
    }
    return false;
}

function removeKDigits(board, k) {
    let count = k;
    while (count !== 0) {
        let cellId = Math.floor(Math.random() * 81);
        let i = Math.floor(cellId / 9);
        let j = cellId % 9;
        if (board[i][j] !== 0) {
            board[i][j] = 0;
            count--;
        }
    }
}

// ------------------------------------
// UI Alerts
// ------------------------------------

function showMessage(message, type) {
    const messageEl = document.getElementById('message');
    // For warning map to error css
    const actualType = type === 'warning' ? 'error' : type;
    messageEl.textContent = message;
    messageEl.className = 'message ' + actualType;

    if (messageHideTimeoutId !== null) clearTimeout(messageHideTimeoutId);

    if (gsapEnabled()) {
        window.gsap.killTweensOf(messageEl);
        window.gsap.fromTo(
            messageEl,
            { opacity: 0, y: -8 },
            { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }
        );
    }

    messageHideTimeoutId = setTimeout(() => {
        if (gsapEnabled()) {
            window.gsap.to(messageEl, {
                opacity: 0,
                y: -8,
                duration: 0.18,
                ease: 'power1.in',
                onComplete: () => { messageEl.className = 'message'; messageEl.style.opacity = ''; messageEl.style.transform = ''; }
            });
            return;
        }
        messageEl.className = 'message';
    }, 5000);
}

function loadDefaultPuzzle() {
    const defaultBoard = [
        [7, 0, 2, 0, 5, 0, 6, 0, 0],
        [0, 0, 0, 0, 0, 3, 0, 0, 0],
        [1, 0, 0, 0, 0, 9, 5, 0, 0],
        [8, 0, 0, 0, 0, 0, 0, 9, 0],
        [0, 4, 3, 0, 0, 0, 7, 5, 0],
        [0, 9, 0, 0, 0, 0, 0, 0, 8],
        [0, 0, 9, 7, 0, 0, 0, 0, 5],
        [0, 0, 0, 2, 0, 0, 0, 0, 0],
        [0, 0, 7, 0, 4, 0, 2, 0, 3]
    ];
    setBoardToUI(defaultBoard);
    showMessage('Default puzzle loaded.', 'info');
}
