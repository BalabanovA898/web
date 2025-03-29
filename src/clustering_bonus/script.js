const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let points = [];
let clusters = [];
const k = 3;

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    points.push({ x, y });
    drawPoints();
});

document.getElementById('clusterButton').addEventListener('click', () => {
    clusters = kMeans(points, k);
    drawClusters();
});

function drawPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawClusters() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clusters.forEach(cluster => {
        ctx.fillStyle = cluster.color;
        cluster.points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    });
}

function kMeans(data, k) {
    let centroids = initializeCentroids(data, k);
    let clusters = new Array(k).fill(null).map(() => ({ points: [], color: getRandomColor() }));
    let changed = true;

    while (changed) {
        clusters.forEach(cluster => cluster.points = []);
        data.forEach(point => {
            let closestCentroidIndex = findClosestCentroid(point, centroids);
            clusters[closestCentroidIndex].points.push(point);
        });

        changed = false;
        for (let i = 0; i < k; i++) {
            const newCentroid = calculateCentroid(clusters[i].points);
            if (newCentroid && (newCentroid.x !== centroids[i].x || newCentroid.y !== centroids[i].y)) {
                centroids[i] = newCentroid;
                changed = true;
            }
        }
    }
    return clusters;
}

function initializeCentroids(data, k) {
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, k);
}

function findClosestCentroid(point, centroids) {
    return centroids.reduce((closestIndex, centroid, index) => {
        const distance = Math.hypot(point.x - centroid.x, point.y - centroid.y);
        return distance < Math.hypot(point.x - centroids[closestIndex].x, point.y - centroids[closestIndex].y) ? index : closestIndex;
    }, 0);
}

function calculateCentroid(points) {
    if (points.length === 0) return null;
    const centroid = points.reduce((acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
    }, { x: 0, y: 0 });
    return { x: centroid.x / points.length, y: centroid.y / points.length };
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}