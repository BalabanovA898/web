const INITIAL_PIXEL_SIZE = 50;
const FPS = 15;
const REALLY_BIG_INT = 2147483647;
const MAX_CANVAS_WIDTH = Math.min(
    window.screen.width,
    window.screen.height - 350
);
const INITIAL_START_POINT = { x: 0, y: 0 };
const INITIAL_END_POINT = { x: 9, y: 9 };
const INITIAL_COUNT_OF_CELLS = 10;

const canvas = document.getElementById("main-canvas");
const inputCanvasCtx = canvas.getContext("2d");

const inputPixelSize = document.getElementById("main-input-pixel-size");
const pixelSizeButtonSubmit = document.getElementById(
    "main-set-pixel-size-btn"
);
const selectDrawMode = document.getElementById("main-input-select");
const findPathButton = document.getElementById("main-find-path");
const generateMazeButton = document.getElementById("main-generate-maze-btn");
const clearCanvasButton = document.getElementById("main-canvas-clear");

const start = INITIAL_START_POINT;
const end = INITIAL_END_POINT;

let countOfCells = INITIAL_COUNT_OF_CELLS;
let pixelSize = INITIAL_PIXEL_SIZE;
let typeToSet = "wall";
let mx = [];
let markedCells = [];

const colors = {
    wall: "#171723",
    None: "white",
    start: "#004466",
    end: "#aa2200",
    path: "yellow",
    passed: "#828282",
    checking: "#178234",
};

mx = initField(canvas, inputCanvasCtx, countOfCells);

mx[start.x][start.y] = "start";
mx[end.x][end.y] = "end";

function initField(canvas, inputCanvasCtx, countOfCells) {
    canvas.width = countOfCells * pixelSize + countOfCells - 1;
    canvas.height = countOfCells * pixelSize + countOfCells - 1;

    for (let i = 0; i < countOfCells; ++i)
        for (let j = 0; j < countOfCells; ++j) {
            inputCanvasCtx.strokeColor = "black";
            inputCanvasCtx.moveTo(i * pixelSize + i, 0);
            inputCanvasCtx.lineTo(i * pixelSize + i, canvas.height);
            inputCanvasCtx.stroke();
            inputCanvasCtx.moveTo(0, i * pixelSize + i);
            inputCanvasCtx.lineTo(canvas.width, i * pixelSize + i);
            inputCanvasCtx.stroke();
        }

    let matrix = new Array(countOfCells).fill([]);

    for (i = 0; i < countOfCells; ++i)
        matrix[i] = new Array(countOfCells).fill("None");

    return matrix;
}

const isValid = (cell) =>
    cell.x >= 0 &&
    cell.x < countOfCells &&
    cell.y >= 0 &&
    cell.y < countOfCells;

const h = (cell) => Math.sqrt(Math.pow(cell.x, 2) + Math.pow(cell.y, 2));

function tracePath(matrix, cellDetails, end) {
    let i = end.x;
    let j = end.y;

    while (cellDetails[i][j].parentI != i || cellDetails[i][j].parentJ != j) {
        matrix[i][j] = "path";
        new_i = cellDetails[i][j].parentI;
        new_j = cellDetails[i][j].parentJ;
        i = new_i;
        j = new_j;
    }
}

const timer = async (ms) => new Promise((res) => setTimeout(res, ms));

async function A_star(matrix, start, end, isAnimation) {
    const dDirections = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
    ];

    let visited = new Array(countOfCells);
    for (let i = 0; i < countOfCells; ++i)
        visited[i] = new Array(countOfCells).fill(false);

    let cellDetails = new Array(countOfCells);
    for (let i = 0; i < countOfCells; ++i)
        cellDetails[i] = new Array(countOfCells).fill({});

    for (let i = 0; i < countOfCells; i++)
        for (let j = 0; j < countOfCells; j++) {
            cellDetails[i][j] = {
                f: REALLY_BIG_INT,
                h: REALLY_BIG_INT,
                g: REALLY_BIG_INT,
                parentI: -1,
                parentJ: -1,
            };
        }

    cellDetails[start.x][start.y] = {
        f: 0,
        h: 0,
        g: 0,
        parentI: start.x,
        parentJ: start.y,
    };

    let openList = new Map();
    openList.set(0, start);
    let list = [[0, start]];

    while (openList.size) {
        list.sort((a, b) => a[0] - b[0]);
        let currentCell = list[0];
        list.shift();

        let gNew, hNew, fNew;
        visited[currentCell[1].x][currentCell[1].y] = true;
        if (currentCell[1].x !== start.x && currentCell[1].y !== start.y)
            matrix[currentCell[1].x][currentCell[1].y] = "passed";

        while (markedCells.length) {
            matrix[markedCells[markedCells.length - 1].x][
                markedCells[markedCells.length - 1].y
            ] = "passed";
            markedCells.pop();
        }

        for (let item = 0; item < dDirections.length; ++item) {
            let newX = currentCell[1].x + dDirections[item].dx,
                newY = currentCell[1].y + dDirections[item].dy;

            if (isValid({ x: newX, y: newY })) {
                if (newX === end.x && newY === end.y) {
                    tracePath(matrix, cellDetails, {
                        x: newX - dDirections[item].dx,
                        y: newY - dDirections[item].dy,
                    });
                    return true;
                }

                if (!visited[newX][newY] && matrix[newX][newY] !== "wall") {
                    matrix[newX][newY] = "checking";
                    markedCells.push({ x: newX, y: newY });
                    gNew =
                        cellDetails[newX - dDirections[item].dx][
                            newY - dDirections[item].dy
                        ].g + 1;
                    hNew = Math.hypot(newX - start.x, newY - start.y);
                    fNew = gNew + hNew;

                    if (
                        cellDetails[newX][newY].f === REALLY_BIG_INT ||
                        cellDetails[newX][newY].f > fNew
                    ) {
                        list.push([fNew, { x: newX, y: newY }]);
                        cellDetails[newX][newY] = {
                            f: fNew,
                            h: hNew,
                            g: gNew,
                            parentI: newX - dDirections[item].dx,
                            parentJ: newY - dDirections[item].dy,
                        };
                    }
                }
            }
        }
        if (isAnimation) await timer(30);
    }
    return false;
}

function generateMazeRecursive(matrix, visited, currentCell) {
    let directions = [
        { x: -2, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 2 },
        { x: 0, y: -2 },
    ].filter((item) =>
        isValid({ x: item.x + currentCell.x, y: item.y + currentCell.y })
    );

    mx[currentCell.x][currentCell.y] = "None";
    visited[currentCell.y * countOfCells + currentCell.x] = true;
    while (directions.length) {
        let currentDirection = getRandomInt(0, directions.length);
        let dCell = directions[currentDirection];
        directions.splice(currentDirection, 1);
        if (
            !visited[
                (currentCell.y + dCell.y) * countOfCells +
                    currentCell.x +
                    dCell.x
            ]
        ) {
            matrix[currentCell.x + dCell.x / 2][currentCell.y + dCell.y / 2] =
                "None";
            generateMazeRecursive(matrix, visited, {
                x: currentCell.x + dCell.x,
                y: currentCell.y + dCell.y,
            });
        }
    }
}

const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min) + min);

pixelSizeButtonSubmit.onclick = (event) => {
    event.preventDefault();

    countOfCells = Number(inputPixelSize.value > 0 ? inputPixelSize.value : 10);

    pixelSize =
        INITIAL_PIXEL_SIZE * countOfCells < MAX_CANVAS_WIDTH
            ? INITIAL_PIXEL_SIZE
            : Math.floor(MAX_CANVAS_WIDTH / countOfCells);

    mx = initField(canvas, inputCanvasCtx, countOfCells);
};

canvas.onclick = (event) => {
    const rect = canvas.getBoundingClientRect();
    const cellX = Math.floor((event.clientX - rect.left) / (1 + pixelSize));
    const cellY = Math.floor((event.clientY - rect.top) / (1 + pixelSize));

    if (typeToSet === "end") {
        mx[end.x][end.y] = "None";
        end.x = cellX;
        end.y = cellY;
    }

    if (typeToSet === "start") {
        mx[start.x][start.y] = "None";
        start.x = cellX;
        start.y = cellY;
    }

    mx[cellX][cellY] = mx[cellX][cellY] === "None" ? typeToSet : "None";
};

findPathButton.onclick = async (event) => {
    event.preventDefault();
    const res = await A_star(mx, start, end, true);
    if (!res) alert("Похоже что пути не сущесвует :(");
};

selectDrawMode.onchange = () => (typeToSet = selectDrawMode.value);

generateMazeButton.onclick = (event) => {
    event.preventDefault();

    mx = initField(canvas, inputCanvasCtx, countOfCells);
    for (let i = 0; i < countOfCells; ++i)
        for (let j = 0; j < countOfCells; ++j)
            mx[i][j] !== "start" && mx[i][j] !== "end" && (mx[i][j] = "wall");

    visited = new Array(countOfCells * countOfCells).fill(false);
    generateMazeRecursive(mx, visited, start);
};

clearCanvasButton.onclick = (event) => {
    event.preventDefault();

    mx = initField(canvas, inputCanvasCtx, countOfCells);
    mx[start.x][start.y] = "start";
    mx[end.x][end.y] = "end";
};

function animation() {
    for (let i = 0; i < countOfCells; ++i)
        for (let j = 0; j < countOfCells; ++j) {
            inputCanvasCtx.fillStyle = colors[mx[i][j]];
            inputCanvasCtx.fillRect(
                i * pixelSize + i,
                j * pixelSize + j,
                pixelSize,
                pixelSize
            );
        }
}

setInterval(animation, 1000 / FPS);

