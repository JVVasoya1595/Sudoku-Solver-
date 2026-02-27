package com.sudoku.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.sudoku.service.SudokuSolverService;

@Controller
@RequestMapping("/")
public class SudokuController {

    @Autowired
    private SudokuSolverService sudokuSolverService;

    private int[][] currentBoard;
    private int[][] originalBoard;

    @GetMapping
    public String index(Model model) {
        // Default board
        currentBoard = new int[][] {
                { 7, 0, 2, 0, 5, 0, 6, 0, 0 },
                { 0, 0, 0, 0, 0, 3, 0, 0, 0 },
                { 1, 0, 0, 0, 0, 9, 5, 0, 0 },
                { 8, 0, 0, 0, 0, 0, 0, 9, 0 },
                { 0, 4, 3, 0, 0, 0, 7, 5, 0 },
                { 0, 9, 0, 0, 0, 0, 0, 0, 8 },
                { 0, 0, 9, 7, 0, 0, 0, 0, 5 },
                { 0, 0, 0, 2, 0, 0, 0, 0, 0 },
                { 0, 0, 7, 0, 4, 0, 2, 0, 3 }
        };
        originalBoard = sudokuSolverService.copyBoard(currentBoard);

        model.addAttribute("board", currentBoard);
        return "index";
    }

    @PostMapping("/solve")
    @ResponseBody
    public SolveResponse solve(@RequestBody int[][] board) {
        currentBoard = sudokuSolverService.copyBoard(board);
        originalBoard = sudokuSolverService.copyBoard(board);

        if (sudokuSolverService.solveBoard(currentBoard)) {
            return new SolveResponse(true, "Puzzle solved successfully!", currentBoard);
        } else {
            return new SolveResponse(false, "This puzzle is unsolvable!", currentBoard);
        }
    }

    @PostMapping("/reset")
    @ResponseBody
    public ResetResponse reset() {
        currentBoard = sudokuSolverService.copyBoard(originalBoard);
        return new ResetResponse(true, "Board reset successfully!", currentBoard);
    }

    @PostMapping("/clear")
    @ResponseBody
    public ResetResponse clear() {
        currentBoard = new int[9][9];
        originalBoard = sudokuSolverService.copyBoard(currentBoard);
        return new ResetResponse(true, "Board cleared successfully!", currentBoard);
    }

    @PostMapping("/validate")
    @ResponseBody
    public ValidateResponse validate(@RequestBody int[][] board) {
        boolean hasDuplicates = checkForDuplicates(board);
        return new ValidateResponse(!hasDuplicates,
                hasDuplicates ? "Invalid: Duplicate numbers found" : "Valid board");
    }

    private boolean checkForDuplicates(int[][] board) {
        // Check rows
        for (int row = 0; row < 9; row++) {
            boolean[] seen = new boolean[10];
            for (int col = 0; col < 9; col++) {
                int num = board[row][col];
                if (num != 0 && seen[num]) {
                    return true;
                }
                if (num != 0)
                    seen[num] = true;
            }
        }

        // Check columns
        for (int col = 0; col < 9; col++) {
            boolean[] seen = new boolean[10];
            for (int row = 0; row < 9; row++) {
                int num = board[row][col];
                if (num != 0 && seen[num]) {
                    return true;
                }
                if (num != 0)
                    seen[num] = true;
            }
        }

        // Check 3x3 boxes
        for (int boxRow = 0; boxRow < 3; boxRow++) {
            for (int boxCol = 0; boxCol < 3; boxCol++) {
                boolean[] seen = new boolean[10];
                for (int i = boxRow * 3; i < boxRow * 3 + 3; i++) {
                    for (int j = boxCol * 3; j < boxCol * 3 + 3; j++) {
                        int num = board[i][j];
                        if (num != 0 && seen[num]) {
                            return true;
                        }
                        if (num != 0)
                            seen[num] = true;
                    }
                }
            }
        }

        return false;
    }

    // Response DTOs
    public static class SolveResponse {
        public boolean success;
        public String message;
        public int[][] board;

        public SolveResponse(boolean success, String message, int[][] board) {
            this.success = success;
            this.message = message;
            this.board = board;
        }
    }

    public static class ResetResponse {
        public boolean success;
        public String message;
        public int[][] board;

        public ResetResponse(boolean success, String message, int[][] board) {
            this.success = success;
            this.message = message;
            this.board = board;
        }
    }

    public static class ValidateResponse {
        public boolean valid;
        public String message;

        public ValidateResponse(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }
    }
}
