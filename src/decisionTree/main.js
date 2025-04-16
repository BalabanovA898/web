const MAX_TREE_DEPTH = 4;
const MIN_LEAF_SIZE = 6;
const INITIAL_NODE_RADIUS = 75;
const FPS = 3;

function getProbabilityToBeClass(table, rowToSearch, classToCheck) {
    let count = table[rowToSearch].reduce((res, item) => {
        res = res + (item == classToCheck ? 1 : 0);
        return res;
    }, 0);
    return count ? count / table[rowToSearch].length : 0;
}

function E(table, rowToSearch, classCount, classList) {
    let probabilities = new Array(classCount).fill(0);
    for (let i = 0; i < classCount; ++i)
        probabilities[i] = getProbabilityToBeClass(
            table,
            rowToSearch,
            classList[i]
        );
    let result = probabilities.reduce(
        (result, item) =>
            result +
            item * (Math.log2(item) !== -Infinity ? Math.log2(item) : 0),
        0
    );

    return -1 * result;
}

function Q(table, a, b, rowToCheck, classCount, classList) {
    let entropyTable = E(table, rowToCheck, classCount, classList),
        entropyA = E(a, rowToCheck, classCount, classList),
        entropyB = E(b, rowToCheck, classCount, classList),
        proportionA = a[rowToCheck].length / table[rowToCheck].length,
        proportionB = b[rowToCheck].length / table[rowToCheck].length;

    return entropyTable - proportionA * entropyA - proportionB * entropyB;
}

function transpose(table) {
    let res = new Array(table[0].length);
    for (let i = 0; i < table[0].length; ++i)
        res[i] = new Array(table.length - 1);

    let headers = table[0];
    for (let i = 1; i < table.length; ++i)
        for (let j = 0; j < table[0].length; ++j) res[j][i - 1] = table[i][j];
    return [headers, res];
}

function splitTable(table, rowToCheck, condition) {
    let a = new Array(table.length),
        b = new Array(table.length);
    for (let i = 0; i < table.length; ++i) {
        a[i] = [];
        b[i] = [];
    }

    for (let i = 0; i < table[rowToCheck].length; ++i) {
        if (condition(table[rowToCheck][i]))
            for (let j = 0; j < table.length; ++j) a[j].push(table[j][i]);
        else for (let j = 0; j < table.length; ++j) b[j].push(table[j][i]);
    }
    return [a, b];
}

function calculateInformationGain(table, columnToSearch, classes, condition) {
    let informationGain = [[]];
    for (let i = 0; i < table.length; ++i)
        informationGain[i] = new Array(table[i].length).fill(0);

    for (let i = 0; i < table.length; ++i) {
        for (let j = 0; j < table[i].length; ++j) {
            let [a, b] = splitTable(table, i, (item) =>
                condition(item, table[i][j])
            );
            informationGain[i][j] = Q(
                table,
                a,
                b,
                columnToSearch,
                classes.length,
                classes
            );
        }
    }
    return informationGain;
}

function getMaxInformationGainIndexes(informationGain, rowToCheck) {
    let maxI = 0,
        maxJ = 0;
    for (let i = 0; i < informationGain.length; ++i)
        for (let j = 0; j < informationGain[i].length; ++j)
            if (
                i != rowToCheck &&
                informationGain[i][j] > informationGain[maxI][maxJ]
            ) {
                maxI = i;
                maxJ = j;
            }

    return [maxI, maxJ];
}

function splitTableByIndex(table, index) {
    let a = new Array(table.length),
        b = new Array(table.length);
    for (let i = 0; i < table.length; ++i) {
        a[i] = [];
        b[i] = [];
    }

    for (let i = 0; i < table.length; ++i) {
        for (let j = 0; j < table[i].length; ++j) {
            if (j < index) a[i].push(table[i][j]);
            else b[i].push(table[i][j]);
        }
    }
    return [a, b];
}

class decisionTreeLeaf {
    constructor(
        dataSet,
        condition,
        level,
        columnToSearch,
        classes,
        value,
        nodeColor = "black"
    ) {
        this.dataSet = dataSet;
        this.condition = condition;
        this.level = level;
        this.left = null;
        this.right = null;
        this.columnToSearch = columnToSearch;
        this.classes = classes;
        this.value = value;
        this.nodeColor = nodeColor;
    }

    splitLeaf() {
        if (
            this.level + 1 < MAX_TREE_DEPTH &&
            this.dataSet.length < MIN_LEAF_SIZE
        ) {
            let informationGain = calculateInformationGain(
                this.dataSet,
                this.columnToSearch,
                this.classes,
                (item, value) => item < value
            );
            let [x, y] = getMaxInformationGainIndexes(
                informationGain,
                this.columnToSearch
            );
            let [a, b] = splitTableByIndex(this.dataSet, y);
            this.condition = { row: x, value: this.dataSet[x][y] };
            this.left = new decisionTreeLeaf(
                a,
                null,
                this.level + 1,
                this.columnToSearch,
                this.classes,
                null
            );
            this.right = new decisionTreeLeaf(
                b,
                null,
                this.level + 1,
                this.columnToSearch,
                this.classes,
                null
            );
            return true;
        } else {
            let probabilities = new Array(this.classes.length).fill(0);
            for (let i = 0; i < this.classes.length; ++i)
                probabilities[i] = getProbabilityToBeClass(
                    this.dataSet,
                    this.columnToSearch,
                    this.classes[i]
                );
            let iMax = 0;
            for (let i = 0; i < probabilities.length; ++i)
                if (probabilities[i] > probabilities[iMax]) iMax = i;
            this.value = this.classes[iMax];
            return false;
        }
    }

    predict(data) {
        this.nodeColor = "red";
        if (this.value) return this.value;
        if (Number(data[this.condition.row]) < Number(this.condition.value)) {
            return this.left.predict(data);
        } else {
            return this.right.predict(data);
        }
    }
}
const csvTextArea = document.getElementById("csv-input");
const csvLoad = document.getElementById("csv-load");
const testDataTextArea = document.getElementById("test-data");
const testDataLoad = document.getElementById("test-data-load");
const decisionTreeCanvas = document.getElementById("decision-tree-canvas");
const testResult = document.getElementById("test-result");
const fileLoad = document.getElementById("file-load");

const ctx = decisionTreeCanvas.getContext("2d");

decisionTreeCanvas.width = 1000;
decisionTreeCanvas.height = 1000;

decisionTreeCanvas.style.backgroundColor = "#171723";

let csvData = "";
let testData = "";

let data = [[]];
let headers = [];
let transposedData = [[]];
let path = [{ x: INITIAL_NODE_RADIUS, y: INITIAL_NODE_RADIUS + 10 }];

let columnToSearch = 0;

let classes = [];
const lesserThan = (item, value) => {
    return item < value;
};

let root = null;

csvLoad.onclick = (event) => {
    event.preventDefault();
    csvData = csvTextArea.value;
    data = csvData.split("\n").map((item) => item.split(","));
    [headers, transposedData] = transpose(data);

    columnToSearch = document.getElementById("columnToSearch").value - 1;
    classes = [...new Set(transposedData[columnToSearch])].filter(
        (item) => item != undefined
    );

    root = new decisionTreeLeaf(
        transposedData,
        null,
        0,
        columnToSearch,
        classes,
        null
    );

    let nodes = [root];
    while (nodes.length > 0) {
        let node = nodes[0];
        nodes.splice(0, 1);
        if (node.splitLeaf()) nodes.push(node.left, node.right);
    }
};

function drawTestPath(ctx, path) {
    ctx.fillStyle = "red";
    ctx.strokeStyle = "red";
    console.log(path);

    for (let i = 0; i < path.length; ++i) {
        ctx.beginPath();
        ctx.arc(path[i].x, path[i].y, 10, 0, 2 * Math.PI);
        ctx.fill();
        if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(path[i - 1].x, path[i - 1].y);
            ctx.lineTo(path[i].x, path[i].y);
            ctx.stroke();
        }
    }
}

function clearCanvas(ctx) {
    ctx.clearRect(0, 0, decisionTreeCanvas.width, decisionTreeCanvas.height);
}

function drawDecisionTree(ctx, root) {
    if (!root) return;
    ctx.fillStyle = "black";
    let nodes = [root];
    while (nodes.length > 0) {
        let children = [];
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].left) children.push(nodes[i].left);
            if (nodes[i].right) children.push(nodes[i].right);
        }
        for (let i = 0; i < nodes.length; i++) {
            ctx.fillStyle = nodes[i].nodeColor;
            ctx.beginPath();
            ctx.arc(
                (1000 / nodes.length) * i +
                    0.5 *
                        Math.min(1000 / nodes.length, INITIAL_NODE_RADIUS * 2),
                170 * nodes[i].level +
                    0.5 *
                        Math.min(1000 / nodes.length, INITIAL_NODE_RADIUS * 2),
                Math.min(1000 / nodes.length, INITIAL_NODE_RADIUS * 2) / 2,
                0,
                2 * Math.PI
            );
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.font = "15px Arial";
            ctx.fillText(
                !nodes[i].value
                    ? headers[nodes[i].condition.row] +
                          " < " +
                          nodes[i].condition.value
                    : nodes[i].value,
                (1000 / nodes.length) * i + 30,
                170 * nodes[i].level + 75
            );
        }
        nodes = children;
    }
}

testDataLoad.onclick = (event) => {
    csvLoad.onclick(event);
    event.preventDefault();
    testData = testDataTextArea.value;
    testData = testData.split("\n").map((item) => item.split(","));
    testResult.innerHTML = root.predict(testData[0], path);
};

setInterval(() => {
    clearCanvas(ctx);
    drawDecisionTree(ctx, root);
    if (path.length > 1) drawTestPath(ctx, path);
}, 1000 / FPS);

fileLoad.onchange = async (event) => {
    let file = await new Response(fileLoad.files[0]).text();
    csvTextArea.value = file;
};

