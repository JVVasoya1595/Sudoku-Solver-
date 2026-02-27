# SUDOKU.exe // SOLVER

![Cyberpunk Sudoku](https://img.shields.io/badge/Theme-Cyberpunk-blueviolet?style=for-the-badge) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.1.5-brightgreen?style=for-the-badge&logo=spring) ![Java](https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=java)

Welcome to **SUDOKU.exe // SOLVER**, a cutting-edge real-time Sudoku engine. Built with **Spring Boot** and **Vanilla JS**, it features a gamified cyberpunk UI. Solve matrices instantly in **SOLVER_MODE** or test your skills in **GAME_MODE** with lifelines and hints. Enter parameters and execute logic in a robust, dynamic environment.

## 🌟 Key Features

### 🎮 Dual-Mode Interface
- **SOLVER_MODE**: A robust engine to instantly parse and solve any valid Sudoku puzzle matrix inputted manually or via bulk matrix injection.
- **GAME_MODE**: A fully playable Sudoku game featuring varying difficulty levels (Easy, Medium, Hard, Expert). Includes gamified elements like **Lives (❤❤❤)** and **Hints**, tracking your progress and penalizing invalid data inputs.

### ⚡ Futuristic Action Controls
- **EXECUTE_SOLVER**: Automatically processes and completes your matrix using optimized backtracking.
- **SCAN_VALIDITY**: Runs integrity checks on the current grid data to find anomalies (duplicate or conflicting sectors).
- **REBOOT_PUZZLE**: Restores the board parameters to the baseline puzzle state.
- **PURGE_DATA**: completely wipes the board grid.
- **DIRECT_MATRIX_INPUT**: Rapidly inject puzzle data via text area in a standard 9x9 matrix format instead of clicking each box.

### 🎨 State-of-the-Art Aesthetic
- **Cyberpunk Theme**: Glow effects, dark backgrounds, high-contrast neon highlights.
- **Responsive Layout**: Designed for seamless data interaction on both desktop terminals and mobile devices.

---

## 🛠 Prerequisites System Requirements

Before you initiate the system, ensure your environment meets the following specifications:
- **Java Development Kit (JDK) 17** or higher.
- **Apache Maven 3.6** or higher (or you can use the bundled Maven wrapper if available).
- An internet connection (to download dependencies on the first run).

*(To verify installations, run `java -version` and `mvn -version` in your terminal)*

---

## 🚀 Step-by-Step Installation & Boot Process

Follow these instructions exactly to start the `SUDOKU.exe` backend node:

### Step 1: Clone or Navigate to the Project Directory
Open your terminal/command line interface and navigate to the project root directory where the `pom.xml` is located.
```bash
cd "path/to/sudoku solver"
```

### Step 2: Compile and Build the Project
Use Apache Maven to install dependencies, compile the Java code, and build the application package.
```bash
mvn clean install
```
*Wait for the `BUILD SUCCESS` message. This will download all the necessary Spring Boot packages.*

### Step 3: Run the Local Server Application
Execute the Spring Boot standard run command to start the embedded Tomcat web server.
```bash
mvn spring-boot:run
```
*(Alternatively, you can run the generated packaged JAR file: `java -jar target/sudoku-solver-1.0.0.jar`)*

### Step 4: Access the System Interface
Once the console outputs that Tomcat started on port 8080 (e.g., `Started SudokuSolverApplication in X.XX seconds`), open your favorite modern web browser and navigate the URL to:
```
http://localhost:8080
```
**System is now READY. Enter Parameters!**

---

## 📖 How to Use the Interface

### In SOLVER_MODE:
1. **Input Data**: Enter numerical digits (1-9) into the grid manually, or paste a 9x9 text block into the `>> DIRECT_MATRIX_INPUT` console and click **LOAD_MATRIX_DATA**.
2. **Execute**: Click **EXECUTE_SOLVER** to compute the solution.
3. **Verify**: Click **SCAN_VALIDITY** at any point to identify rule-breaking coordinate data.

### In GAME_MODE:
1. **Select Difficulty**: Choose from Easy (30 blanks), Medium (40 blanks), Hard (50 blanks), or Expert (60 blanks).
2. **Initialize**: Click **INIT_GAME** to generate a fresh Sudoku puzzle.
3. **Play**: Input your answers. Incorrect entries will drain your **LIVES**. 
4. **Acquire Help**: Need an assist? Use **USE_HINT** (max 3 available per session).
5. **Survive**: Complete the matrix before you run out of lives! If trapped, you can use **GIVE_UP**.

---

## 📡 Core API Endpoints

The internal architecture provides several RESTful endpoints interacting with the frontend:

- `GET /` : Serves the main UI layer.
- `POST /solve` : Computes and returns the completed Sudoku puzzle matrix.
- `POST /reset` : Returns to the original, initial puzzle matrix state.
- `POST /clear` : Deletes all board data resulting in a fresh state.
- `POST /validate` : Scans the matrix rules and verifies board integrity.

*Example `/solve` Response Data:*
```json
{
  "success": true,
  "message": "Puzzle solved successfully!",
  "board": [ [7, 8, ...], ... ]
}
```

---

## ⚙️ Built With (Technology Stack)
- **Engine**: Java 17, Spring Boot 3.1.5
- **Template Rendering**: Thymeleaf
- **Data Model Management**: Lombok
- **Frontend / Cyber Structure**: HTML5, Vanilla CSS3, Vanilla JavaScript
- **Build System**: Maven

---

## 🔧 Troubleshooting

- **"Port 8080 Already in Use"**: The system cannot bind to the default port. Edit `src/main/resources/application.properties` and add/change `server.port=8081` (or another free port).
- **"Java check fail" / "Unsupported class file major version"**: Ensure you are using Java 17. The project requires JDK 17 minimum.
- **Maven Errors**: Ensure Maven is added to your environment `PATH` variables.

---

## 📜 Legal & Support

**License**: This project is distributed under the MIT License.
**Support**: If you experience core errors, check the terminal/console output and browser DevTools Network tab for stack traces.

> **[ END OF LINE ]** ENJOY YOUR DATA SIMULATION.
