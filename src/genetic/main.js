let POPULATION_SIZE = 100;
let ITERATION_COUNT = 300;
const FPS = 15;

const canvas = document.getElementById("main-canvas");
const inputCanvasCtx = canvas.getContext("2d");
const startButton = document.getElementById("start-btn");
const resultP = document.getElementById("result");
const clearButton = document.getElementById("clear-btn");

const inputPopulationSize = document.getElementById("input1");
const inputCountOfIteration = document.getElementById("input2");

let cities = [];

const getDistance = (city1, city2) =>
    Math.sqrt(Math.pow(city1.x - city2.x, 2) + Math.pow(city1.y - city2.y, 2));

let bestPath = getRandomStats(cities.length);

let isStarted = false;

canvas.onclick = (event) => {
    inputCanvasCtx.fillStyle = "red";
    inputCanvasCtx.beginPath();
    inputCanvasCtx.arc(event.offsetX, event.offsetY, 10, 0, 2 * Math.PI);
    inputCanvasCtx.fill();
    for (let i = 0; i < cities.length; ++i) {
        inputCanvasCtx.strokeColor = "red";
        inputCanvasCtx.moveTo(event.offsetX, event.offsetY);
        inputCanvasCtx.lineTo(cities[i].x, cities[i].y);
        inputCanvasCtx.stroke();
    }
    cities.push({ x: event.offsetX, y: event.offsetY });
    bestPath = getRandomStats(cities.length);
};

const getRandomArbitrary = (min, max) =>
    Math.floor(Math.random() * (max - min) + min);

function getRandomStats(n) {
    let res = [];
    let availableNodes = new Array(n);
    for (let i = 0; i < n; ++i) availableNodes[i] = i + 1;
    while (availableNodes.length) {
        let indexToPick = getRandomArbitrary(0, availableNodes.length);
        res.push(availableNodes[indexToPick]);
        availableNodes.splice(indexToPick, 1);
    }
    return res;
}

function evolution(a, b) {
    let res = [];
    for (let i = 0; i < a.length; ++i) {
        if (!res.includes(a[i])) res.push(a[i]);
        if (!res.includes(b[i])) res.push(b[i]);
    }
    return res;
}

function mutationB(a) {
    a.unshift(a.pop());
    return a;
}

function mutationC(a) {
    let b = [...a];
    while (true) {
        let iA = getRandomArbitrary(0, a.length);
        let iB = getRandomArbitrary(0, a.length);
        if (iA !== iB) {
            let temp = b[iA];
            b[iA] = b[iB];
            b[iB] = temp;
            return b;
        }
    }
}

clearButton.onclick = (event) => {
    event.preventDefault();
    cities = [];
};

function calculatePathLength(path) {
    let distance = 0;
    for (let i = 0; i < path.length - 1; ++i)
        distance += getDistance(cities[path[i] - 1], cities[path[i + 1] - 1]);
    return distance;
}

const comparePathsLength = (a, b) => {
    let aDistance = calculatePathLength([...a, a[0]]),
        bDistance = calculatePathLength([...b, b[0]]);
    return aDistance - bDistance;
};

startButton.onclick = async (event) => {
    isStarted = true;

    POPULATION_SIZE = inputPopulationSize.value;
    ITERATION_COUNT = inputCountOfIteration.value;

    let population = new Array(POPULATION_SIZE)
        .fill(0)
        .map(() => getRandomStats(cities.length));

    for (let i = 0; i < ITERATION_COUNT; ++i) {
        bestPath = population[0];

        let parents = [];
        for (let i = 0; (i < 4) & (i < population.length); ++i)
            parents.push(population[i]);

        let newPopulation = [];

        parents.forEach((item, index) => {
            for (let i = 0; i < POPULATION_SIZE / 4; ++i) {
                newPopulation.push(item);
                newPopulation.push(mutationB(item));
                newPopulation.push(mutationC(item));
            }
        });
        population = newPopulation.toSorted(comparePathsLength);
        resultP.innerText = "gen " + i + ") " + bestPath.join(" ");
        await timer(30);
    }
    population = population.toSorted(comparePathsLength);
    bestPath = population[0];
};

const timer = async (ms) => new Promise((res) => setTimeout(res, ms));

inputCanvasCtx.font = "50px Arial";

setInterval(() => {
    inputCanvasCtx.fillStyle = "#171723";
    inputCanvasCtx.fillRect(0, 0, 1000, 1000);

    if (!isStarted) {
        inputCanvasCtx.strokeStyle = "#000";
        for (let i = 0; i < cities.length - 1; ++i)
            for (let j = i + 1; j < cities.length; ++j) {
                inputCanvasCtx.beginPath();
                inputCanvasCtx.moveTo(cities[j].x, cities[j].y);
                inputCanvasCtx.lineTo(cities[i].x, cities[i].y);
                inputCanvasCtx.stroke();
            }
    }
    if (cities.length) {
        inputCanvasCtx.strokeStyle = "#ffff00";
        inputCanvasCtx.moveTo(
            cities[bestPath[0] - 1].x,
            cities[bestPath[0] - 1].y
        );
        for (let i = 1; i < cities.length; ++i)
            inputCanvasCtx.lineTo(
                cities[bestPath[i] - 1].x,
                cities[bestPath[i] - 1].y
            );

        inputCanvasCtx.lineTo(
            cities[bestPath[0] - 1].x,
            cities[bestPath[0] - 1].y
        );
        inputCanvasCtx.stroke();
    }
    inputCanvasCtx.fillStyle = "red";
    for (let i = 0; i < cities.length; ++i) {
        inputCanvasCtx.beginPath();
        inputCanvasCtx.arc(cities[i].x, cities[i].y, 10, 0, 2 * Math.PI);
        inputCanvasCtx.fillText(i + 1, cities[i].x, cities[i].y + 50);
        inputCanvasCtx.fill();
    }
}, 1000 / FPS);

