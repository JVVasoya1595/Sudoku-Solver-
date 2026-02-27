// State Variables
let currentMode = 'solver'; // 'solver' or 'game'
let gameSolution = null;
let lifelines = 3;
let hints = 3;
let gameActive = false;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {
    initializeBoard();
    setupEventListeners();
    loadDefaultPuzzle();
});

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
                    checkWinCondition();
                } else {
                    this.classList.add('wrong');
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
        loadDefaultPuzzle();
        showMessage('SYSTEM SWITCHED TO SOLVER MODE', 'info');
    } else {
        showMessage('SYSTEM SWITCHED TO GAME MODE. AWAITING INIT...', 'info');
    }
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
    fetch('/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getBoardFromUI())
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                setBoardToUI(data.board);
                showMessage('EXECUTION COMPLETE: SOLUTION FOUND', 'success');
            } else {
                showMessage(data.message, 'error');
            }
        }).catch(e => showMessage('NETWORK ERROR', 'error'));
}

function resetPuzzle() {
    fetch('/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                setBoardToUI(data.board);
                showMessage('SYSTEM REBOOTED', 'success');
            }
        });
}

function clearBoard() {
    if (confirm('Initiate complete data purge?')) clearBoardAction();
}

function clearBoardAction() {
    const inputs = document.querySelectorAll('.sudoku-board input');
    inputs.forEach(input => {
        input.value = '';
        input.className = '';
        input.removeAttribute('readonly');
    });
    gameActive = false;
}

function validatePuzzle() {
    fetch('/validate', {
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
    if (!input.trim()) return showMessage('NO DATA DETECTED', 'error');
    const numbers = input.match(/\d/g);
    if (!numbers || numbers.length < 81) return showMessage('INVALID DATA STREAM', 'error');

    const board = [];
    for (let i = 0; i < 9; i++) {
        const row = [];
        for (let j = 0; j < 9; j++) row.push(parseInt(numbers[i * 9 + j]));
        board.push(row);
    }
    setBoardToUI(board);
    showMessage('DATA INJECTED SUCCESSFULLY', 'success');
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

    showMessage(`PUZZLE GENERATED. DIFFICULTY: ${diffNode.toUpperCase()}`, 'info');
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
        gameActive = false;
        showMessage('CRITICAL FAILURE. NO LIVES REMAINING. GAME OVER.', 'error');
    } else {
        showMessage('INCORRECT DATA. LIFE LOST!', 'warning');
    }
}

function provideHint() {
    if (!gameActive) return showMessage('NO ACTIVE SIMULATION', 'error');
    if (hints <= 0) return showMessage('NO HINTS REMAINING', 'error');

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
    if (!gameActive) return;
    setBoardToUI(gameSolution, true);
    document.querySelectorAll('.sudoku-board input').forEach(i => i.classList.add('wrong'));
    gameActive = false;
    showMessage('SIMULATION ABORTED. SHOWING SOLUTION SOLUTION.', 'error');
}

function checkWinCondition() {
    const inputs = document.querySelectorAll('.sudoku-board input');
    const allFilled = Array.from(inputs).every(input => input.value !== '');

    if (allFilled && gameActive) {
        gameActive = false;
        showMessage('MISSION ACCOMPLISHED! GRID STABILIZED!', 'success');
        document.querySelectorAll('.sudoku-board input').forEach(i => {
            i.classList.remove('correct', 'wrong');
            i.style.color = '#0f0';
            i.style.textShadow = '0 0 10px #0f0';
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
    setTimeout(() => { messageEl.className = 'message'; }, 5000);
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
    showMessage('DEFAULT PUZZLE LOADED', 'info');
}
