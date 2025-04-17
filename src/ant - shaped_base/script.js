const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let points = [];
let bestPath = [];
let bestDistance = Infinity;

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    points.push({ x, y });
    drawPoints();
});

function drawPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();
        ctx.fillText(index, point.x + 5, point.y - 5);
    });
    drawBestPath();
}

function drawBestPath() {
    if (bestPath.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[bestPath[0]].x, points[bestPath[0]].y);
        for (let i = 1; i < bestPath.length; i++) {
            ctx.lineTo(points[bestPath[i]].x, points[bestPath[i]].y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

document.getElementById('startButton').addEventListener('click', () => {
    if (points.length < 2) {
        alert('Добавьте хотя бы две точки!');
        return;
    }
    bestPath = [];
    bestDistance = Infinity;
    antColonyOptimization();
});

function antColonyOptimization() {
    const iterations = 1000; // Количество итераций
    const alpha = 1; // Влияние феромонов
    const beta = 2; // Влияние расстояний
    const evaporationRate = 0.1; // Темп испарения феромонов
    const pheromones = Array(points.length).fill(null).map(() => Array(points.length).fill(1));

    for (let iter = 0; iter < iterations; iter++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPoints();

        const path = [];
        let totalDistance = 0;

        const unvisited = [...Array(points.length).keys()];
        let currentPoint = Math.floor(Math.random() * points.length);
        path.push(currentPoint);
        unvisited.splice(unvisited.indexOf(currentPoint), 1);

        while (unvisited.length > 0) {
            const nextPoint = selectNextPoint(currentPoint, unvisited, pheromones, alpha, beta);
            path.push(nextPoint);
            totalDistance += getDistance(points[currentPoint], points[nextPoint]);
            currentPoint = nextPoint;
            unvisited.splice(unvisited.indexOf(currentPoint), 1);
        }

        totalDistance += getDistance(points[path[path.length - 1]], points[path[0]]);

        if (totalDistance < bestDistance) {
            bestDistance = totalDistance;
            bestPath = path;
        }

        drawCurrentPath(path);

        for (let i = 0; i < path.length - 1; i++) {
            const a = path[i];
            const b = path[i + 1];
            pheromones[a][b] += 1 / totalDistance;
            pheromones[b][a] += 1 / totalDistance;
        }


        for (let i = 0; i < pheromones.length; i++) {
            for (let j = 0; j < pheromones[i].length; j++) {
                pheromones[i][j] *= (1 - evaporationRate);
            }
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoints();
    drawBestPath();
}

function drawCurrentPath(path) {
    ctx.beginPath();
    ctx.moveTo(points[path[0]].x, points[path[0]].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(points[path[i]].x, points[path[i]].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function selectNextPoint(current, unvisited, pheromones, alpha, beta) {
    const probabilities = unvisited.map(point => {
        const pheromone = pheromones[current][point];
        const distance = getDistance(points[current], points[point]);
        const eta = 1 / distance;
        return pheromone ** alpha * eta ** beta;
    });

    const total = probabilities.reduce((sum, p) => sum + p, 0);
    const random = Math.random() * total;
    let cumulative = 0;

    for (let i = 0; i < unvisited.length; i++) {
        cumulative += probabilities[i];
        if (cumulative >= random) {
            return unvisited[i];
        }
    }
}

function getDistance(point1, point2) {
    return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

document.getElementById('clearButton').addEventListener('click', () => {
    points = []; 
    bestPath = []; 
    bestDistance = Infinity; 
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
});
