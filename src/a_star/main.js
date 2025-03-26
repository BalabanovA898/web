const INITIAL_PIXEL_SIZE = 50;
const FPS = 15;
const REALLY_BIG_INT = 2147483647;
const MAX_CANVAS_WIDTH = Math.min(
    window.screen.width,
    window.screen.height - 300
);
const INITIAL_START_POINT = { x: 0, y: 0 };
const INITIAL_END_POINT = { x: 9, y: 9 };
const INITIAL_COUNT_OF_CELLS = 10;

const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");

const inputPixelSize = document.getElementById("main-input-pixel-size");
const pixelSizeButtonSubmit = document.getElementById("set-pixel-size-btn");
const selectDrawMode = document.getElementById("main-input-select");
const findPathButton = document.getElementById("main-a-star-btn");
const generateMazeButton = document.getElementById("main-generate-maze-btn");

let countOfCells = INITIAL_COUNT_OF_CELLS;

let mx = [];

let typeToSet = "wall";
let pixelSize = INITIAL_PIXEL_SIZE;

let markedCells = [];

const start = INITIAL_START_POINT;
const end = INITIAL_END_POINT;

mx = initField(canvas, ctx, countOfCells);

mx[start.x][start.y] = "start";
mx[end.x][end.y] = "end";

function initField(canvas, ctx, countOfCells) {
    canvas.width = countOfCells * pixelSize + countOfCells - 1;
    canvas.height = countOfCells * pixelSize + countOfCells - 1;

    for (let i = 0; i < countOfCells; ++i)
        for (let j = 0; j < countOfCells; ++j) {
            ctx.strokeColor = "black";
            ctx.moveTo(i * pixelSize + i, 0);
            ctx.lineTo(i * pixelSize + i, canvas.height);
            ctx.stroke();
            ctx.moveTo(0, i * pixelSize + i);
            ctx.lineTo(canvas.width, i * pixelSize + i);
            ctx.stroke();
        }

    let matrix = new Array(countOfCells).fill([]);

    for (i = 0; i < countOfCells; ++i)
        matrix[i] = new Array(countOfCells).fill("None");

    return matrix;
}

pixelSizeButtonSubmit.onclick = (event) => {
    event.preventDefault();

    countOfCells = Number(inputPixelSize.value > 0 ? inputPixelSize.value : 10);

    pixelSize =
        INITIAL_PIXEL_SIZE * countOfCells < MAX_CANVAS_WIDTH
            ? INITIAL_PIXEL_SIZE
            : Math.floor(MAX_CANVAS_WIDTH / countOfCells);

    mx = initField(canvas, ctx, countOfCells);
};

canvas.onclick = (event) => {
    const cellX = Math.floor(event.offsetX / pixelSize);
    const cellY = Math.floor(event.offsetY / pixelSize);

    if (typeToSet === "start") {
        mx[start.x][start.y] = "None";
        start.x = cellX;
        start.y = cellY;
    }
    if (typeToSet === "end") {
        mx[end.x][end.y] = "None";
        end.x = cellX;
        end.y = cellY;
    }

    mx[cellX][cellY] = mx[cellX][cellY] === "None" ? typeToSet : "None";
};

findPathButton.onclick = async (event) => {
    event.preventDefault();
    !(await A_star(mx, start, end, true)) &&
        alert("Похоже что пути не сущесвует :(");
};

selectDrawMode.onchange = (event) => (typeToSet = selectDrawMode.value);

generateMazeButton.onclick = (event) => {
    console.log("1");
    for (let i = 0; i < countOfCells; ++i)
        for (let j = 0; j < countOfCells; ++j)
            mx[i][j] !== "start" && mx[i][j] !== "end" && (mx[i][j] = "wall");
    event.preventDefault();
    visited = new Array(countOfCells * countOfCells).fill(false);
    generateMazeRecursive(mx, visited, start);
};

setInterval(() => {
    for (let i = 0; i < countOfCells; ++i)
        for (let j = 0; j < countOfCells; ++j) {
            mx[i][j] === "wall" && (ctx.fillStyle = "brown");
            mx[i][j] === "None" && (ctx.fillStyle = "white");
            mx[i][j] === "start" && (ctx.fillStyle = "blue");
            mx[i][j] === "end" && (ctx.fillStyle = "red");
            mx[i][j] === "path" && (ctx.fillStyle = "yellow");
            mx[i][j] === "passed" && (ctx.fillStyle = "grey");
            mx[i][j] === "checking" && (ctx.fillStyle = "green");

            ctx.fillRect(
                i * pixelSize + i,
                j * pixelSize + j,
                pixelSize,
                pixelSize
            );
        }
}, 1000 / FPS);

const isValid = (cell) =>
    cell.x >= 0 &&
    cell.x < countOfCells &&
    cell.y >= 0 &&
    cell.y < countOfCells;

const h = (cell) => Math.sqrt(Math.pow(cell.x, 2) + Math.pow(cell.y, 2));

function tracePath(matrix, cellDetails, end) {
    let i = end.x;
    let j = end.y;
    console.log(cellDetails);

    while (cellDetails[i][j].parent_i != i || cellDetails[i][j].parent_j != j) {
        matrix[i][j] = "path";
        new_i = cellDetails[i][j].parent_i;
        new_j = cellDetails[i][j].parent_j;
        i = new_i;
        j = new_j;
    }
}
const timer = async (ms) => new Promise((res) => setTimeout(res, ms));

async function A_star(matrix, start, end, animation) {
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
                parent_i: -1,
                parent_j: -1,
            };
        }

    cellDetails[start.x][start.y] = {
        f: 0,
        h: 0,
        g: 0,
        parent_i: start.x,
        parent_j: start.y,
    };

    let openList = new Map();
    openList.set(0, start);

    while (openList.size) {
        let p = openList.entries().next().value;

        openList.delete(p[0]);
        let gNew, hNew, fNew;
        visited[p[1].x][p[1].y] = true;
        if (p[1].x !== start.x && p[1].y !== start.y)
            matrix[p[1].x][p[1].y] = "passed";

        while (markedCells.length) {
            matrix[markedCells[markedCells.length - 1].x][
                markedCells[markedCells.length - 1].y
            ] = "passed";
            markedCells.pop();
        }

        for (let dX = -1; dX <= 1; ++dX)
            for (let dY = -1; dY <= 1; ++dY) {
                let i = p[1].x + dX,
                    j = p[1].y + dY;
                if (isValid({ x: i, y: j })) {
                    if (i === end.x && j === end.y) {
                        tracePath(matrix, cellDetails, {
                            x: i - dX,
                            y: j - dY,
                        });
                        return true;
                    }
                    if (!visited[i][j] && matrix[i][j] !== "wall") {
                        matrix[i][j] = "checking";
                        markedCells.push({ x: i, y: j });
                        gNew = cellDetails[i - dX][j - dY].g + 1;
                        hNew = h({ x: i, y: j });
                        fNew = gNew + hNew;

                        if (
                            cellDetails[i][j].f === REALLY_BIG_INT ||
                            cellDetails[i][j].f > fNew
                        ) {
                            openList.set(fNew, { x: i, y: j });
                            cellDetails[i][j] = {
                                f: fNew,
                                h: hNew,
                                g: gNew,
                                parent_i: i - dX,
                                parent_j: j - dY,
                            };
                        }
                    }
                }
            }
        if (animation) await timer(30);
    }
    return false;
}

function generateMazeRecursive(matrix, visited, cell) {
    let directions = [
        { x: -2, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 2 },
        { x: 0, y: -2 },
    ].filter((item) => isValid({ x: item.x + cell.x, y: item.y + cell.y }));

    mx[cell.x][cell.y] = "None";
    visited[cell.y * countOfCells + cell.x] = true;
    while (directions.length) {
        let currentDirection = getRandomInt(0, directions.length);
        let dCell = directions[currentDirection];
        directions.splice(currentDirection, 1);
        if (!visited[(cell.y + dCell.y) * countOfCells + cell.x + dCell.x]) {
            matrix[cell.x + dCell.x / 2][cell.y + dCell.y / 2] = "None";
            generateMazeRecursive(matrix, visited, {
                x: cell.x + dCell.x,
                y: cell.y + dCell.y,
            });
        }
    }
}

const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min) + min);

