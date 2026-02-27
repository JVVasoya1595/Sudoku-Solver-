package com.sudoku.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Board {
    private int[][] grid;
    private int[][] originalGrid;
    private boolean solved;

    public Board(int[][] grid) {
        this.grid = grid;
        this.originalGrid = copyBoard(grid);
        this.solved = false;
    }

    private int[][] copyBoard(int[][] board) {
        int[][] copy = new int[9][9];
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                copy[i][j] = board[i][j];
            }
        }
        return copy;
    }

    public void reset() {
        this.grid = copyBoard(this.originalGrid);
        this.solved = false;
    }
}
