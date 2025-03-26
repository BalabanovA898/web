let POPULATION_SIZE = 100;
let ITERATION_COUNT = 100;
const FPS = 15;

const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("start-btn");
const resultP = document.getElementById("result");

const inputPopulationSize = document.getElementById("input1");
const inputCountOfIteration = document.getElementById("input2");

let cities = [];

const getDistance = (city1, city2) =>
    Math.sqrt(Math.pow(city1.x - city2.x, 2) + Math.pow(city1.y - city2.y, 2));

let bestPath = getRandomStats(cities.length);

let isStarted = false;

canvas.onclick = (event) => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(event.offsetX, event.offsetY, 10, 0, 2 * Math.PI);
    ctx.fill();
    for (let i = 0; i < cities.length; ++i) {
        ctx.strokeColor = "red";
        ctx.moveTo(event.offsetX, event.offsetY);
        ctx.lineTo(cities[i].x, cities[i].y);
        ctx.stroke();
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

function mutationA(a) {
    let iA = getRandomArbitrary(0, cities.length);
    let iB = getRandomArbitrary(0, cities.length);
    while (iA === iB) iB = getRandomArbitrary(0, cities.length);
    let vA = a[iA];
    let vB = a[iB];
    a.splice(iA, 1);
    a.splice(iB < iA ? iB : iB - 1, 1);
    a.push(vA);
    a.unshift(vB);
    return a;
}
function mutationB(a) {
    a.unshift(a.pop());
    return a;
}

inputCountOfIteration.onchange = (event) => {
    ITERATION_COUNT = Number(inputCountOfIteration.value);
};
inputPopulationSize.onchange = (event) => {
    POPULATION_SIZE = Number(inputPopulationSize.value);
};

startButton.onclick = async (event) => {
    isStarted = true;
    let population = new Array(POPULATION_SIZE)
        .fill(0)
        .map(() => getRandomStats(cities.length));
    console.log(population);
    for (let i = 0; i < ITERATION_COUNT; ++i) {
        population = population.toSorted((a, b) => {
            let aDistance = 0,
                bDistance = 0;
            for (let j = 1; j < cities.length; ++j) {
                aDistance += getDistance(
                    cities[a[j] - 1],
                    cities[a[j - 1] - 1]
                );
                bDistance += getDistance(
                    cities[b[j] - 1],
                    cities[b[j - 1] - 1]
                );
            }
            return aDistance - bDistance;
        });
        console.log(population);
        let newPopulation = [];
        for (let j = 0; j < POPULATION_SIZE / 10; ++j)
            for (let k = j + 1; k < POPULATION_SIZE / 10; ++k)
                newPopulation.push(evolution(population[j], population[k]));
        for (let j = 0; j < (POPULATION_SIZE - POPULATION_SIZE / 2) / 4; ++j)
            newPopulation.push(mutationA(population[j]));
        for (let j = 0; j < (POPULATION_SIZE - POPULATION_SIZE / 2) / 4; ++j)
            newPopulation.push(mutationB(population[j]));

        population = newPopulation;
        bestPath = population[0];
        await timer(300);
        resultP.innerText = "gen" + i + " " + bestPath.join(" ");
    }
    console.log(population);
};

const timer = async (ms) => new Promise((res) => setTimeout(res, ms));

ctx.font = "50px Arial";

setInterval(() => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1000, 1000);

    ctx.fillStyle = "red";
    for (let i = 0; i < cities.length; ++i) {
        ctx.beginPath();
        ctx.arc(cities[i].x, cities[i].y, 10, 0, 2 * Math.PI);
        ctx.fillText(i + 1, cities[i].x, cities[i].y + 50);
        ctx.fill();
    }

    if (!isStarted) {
        ctx.strokeStyle = "#000";
        for (let i = 0; i < cities.length - 1; ++i)
            for (let j = i + 1; j < cities.length; ++j) {
                ctx.beginPath();
                ctx.moveTo(cities[j].x, cities[j].y);
                ctx.lineTo(cities[i].x, cities[i].y);
                ctx.stroke();
            }
    }
    if (cities.length) {
        ctx.strokeStyle = "#ffff00";
        ctx.moveTo(cities[bestPath[0] - 1].x, cities[bestPath[0] - 1].y);
        for (let i = 1; i < cities.length; ++i)
            ctx.lineTo(cities[bestPath[i] - 1].x, cities[bestPath[i] - 1].y);
        ctx.stroke();
    }
}, 1000 / FPS);

