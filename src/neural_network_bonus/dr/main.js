const IS_LEARN = false;
const CANVAS_SIZE = 500;
const CELL_SIZE = CANVAS_SIZE / 25;

class Layer {
    constructor(size, nextSize) {
        this.size = size;
        this.neurons = new Array(size).fill(0);
        this.biases = new Array(size).fill(0);
        this.weights = new Array(size);
        for (let i = 0; i < size; ++i)
            this.weights[i] = new Array(nextSize).fill(0);
    }
}

class NeuralNetwork {
    constructor(learningRate, activation, derivative, sizes) {
        this.learningRate = learningRate;
        this.activation = activation;
        this.derivative = derivative;
        this.layers = new Array(sizes.length);
        for (let i = 0; i < sizes.length; ++i) {
            let nextSize = i < sizes.length - 1 ? sizes[i + 1] : 0;
            this.layers[i] = new Layer(sizes[i], nextSize);
            for (let j = 0; j < sizes[i]; ++j) {
                this.layers[i].biases[j] = Math.random() * 2 - 1;
                for (let k = 0; k < nextSize; ++k)
                    this.layers[i].weights[j][k] = Math.random() * 2 - 1;
            }
        }
    }

    feedForward(inputs) {
        this.layers[0].neurons = [...inputs];
        for (let i = 1; i < this.layers.length; ++i) {
            let l = this.layers[i - 1];
            let ll = this.layers[i];
            for (let j = 0; j < ll.size; ++j) {
                ll.neurons[j] = 0;
                for (let k = 0; k < l.size; ++k)
                    ll.neurons[j] += l.neurons[k] * l.weights[k][j];
                ll.neurons[j] += ll.biases[j];
                ll.neurons[j] = this.activation(ll.neurons[j]);
            }
        }
        return [...this.layers[this.layers.length - 1].neurons];
    }

    backpropagation(targets) {
        let errors = new Array(this.layers[this.layers.length - 1].size);
        for (let i = 0; i < this.layers[this.layers.length - 1].size; ++i)
            errors[i] =
                targets[i] - this.layers[this.layers.length - 1].neurons[i];
        for (let k = this.layers.length - 2; k >= 0; --k) {
            let l = this.layers[k];
            let ll = this.layers[k + 1];
            let errorsNext = new Array(l.size).fill(0);
            let gradients = new Array(ll.size).fill(0);
            for (let i = 0; i < ll.size; ++i) {
                gradients[i] =
                    errors[i] * this.derivative(this.layers[k + 1].neurons[i]);
                gradients[i] *= this.learningRate;
            }
            let deltas = new Array(ll.size);
            for (let i = 0; i < ll.size; ++i)
                deltas[i] = new Array(l.size).fill(0);

            for (let i = 0; i < ll.size; ++i) {
                for (let j = 0; j < l.size; ++j)
                    deltas[i][j] = gradients[i] * l.neurons[j];
            }

            for (let i = 0; i < l.size; ++i) {
                errorsNext[i] = 0;
                for (let j = 0; j < ll.size; ++j)
                    errorsNext[i] += l.weights[i][j] * errors[j];
            }
            errors = [...errorsNext];
            let weightsNew = new Array(l.weights.length);
            for (let i = 0; i < l.weights.length; ++i)
                weightsNew[i] = new Array(l.weights[0].length);
            for (let i = 0; i < ll.size; ++i)
                for (let j = 0; j < l.size; ++j)
                    weightsNew[j][i] = l.weights[j][i] + deltas[i][j];
            l.weights = [...weightsNew];
            for (let i = 0; i < ll.size; ++i) {
                ll.biases[i] += gradients[i];
            }
        }
    }
}

function loadImages(res, index, counter, end, onend) {
    if (counter == 10) {
        console.log(index);
        counter = 0;
        index += 1;
    }
    if (index == end) {
        onend();
        return;
    }
    let canvas = document.createElement("canvas");
    let inputCanvasCtx = canvas.getContext("2d");
    let path = "../train/" + data[counter][index];
    const image = new Image();
    canvas.width = 25;
    canvas.height = 25;
    let imageData = null;
    image.src = path;
    image.onload = () => {
        inputCanvasCtx.drawImage(image, 0, 0, 25, 25);
        imageData = inputCanvasCtx.getImageData(0, 0, 25, 25).data;
        res.push(imageData);
        loadImages(res, index, counter + 1, end, onend);
    };
    console.log(index);
}

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const dsigmoid = (x) => x * (1 - x);

let nn = new NeuralNetwork(0.001, sigmoid, dsigmoid, [625, 512, 128, 32, 10]);

let samples = 30000;

let images = [];
let digits = [];

let model = "";

if (IS_LEARN)
    loadImages(images, 0, 0, samples / 10, function () {
        let inputs = new Array(samples);
        for (let i = 0; i < samples; ++i) inputs[i] = new Array(625);
        for (let i = 0; i < samples; ++i)
            for (let x = 0; x < 25; ++x)
                for (let y = 0; y < 25; ++y)
                    inputs[i][x + y * 25] = images[i][(x + y * 25) * 4] / 255.0;
        let epochs = 1000;
        for (let i = 0; i < epochs; ++i) {
            let right = 0;
            let errorSum = 0;
            let batchSize = 100;
            for (let j = 0; j < batchSize; ++j) {
                let imgIndex = Math.floor(Math.random() * samples);
                let targets = new Array(10).fill(0);
                targets[imgIndex % 10] = 1;

                let output = nn.feedForward(inputs[imgIndex]);
                let maxDigit = 0;
                let maxDigitWeight = -1;
                for (let k = 0; k < 10; ++k) {
                    if (output[k] > maxDigitWeight) {
                        maxDigitWeight = output[k];
                        maxDigit = k;
                    }
                }
                if (imgIndex % 10 == maxDigit) right++;
                for (let k = 0; k < 10; ++k)
                    errorSum +=
                        (targets[k] - output[k]) * (targets[k] - output[k]);
                nn.backpropagation(targets);
            }
            console.log(i, right, errorSum);
        }
        for (let i = 0; i < 5; ++i) {
            model += JSON.stringify(nn.layers[i]);
        }
        downloadModel.setAttribute("download", "model.txt");
        downloadModel.href = makeTextFile(null, model);
        console.log("Done");
    });
else nn.layers = model_layers;

const makeTextFile = (textFile, text) => {
    var data = new Blob([text], { type: "text/plain" });

    if (textFile !== null) {
        window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);
};

const canvas = document.getElementById("digit-recognize-canvas");
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;
canvas.style.backgroundColor = "#171723";
const inputCanvasCtx = canvas.getContext("2d");

const resultCanvas = document.getElementById("results");
resultCanvas.width = 100;
resultCanvas.height = CANVAS_SIZE;
resultCanvas.style.backgroundColor = "#171723";
const resultCanvasCtx = resultCanvas.getContext("2d");

const downloadModel = document.getElementById("download-model");
const resultP = document.getElementById("result-p");
const canvasClear = document.getElementById("canvas-clear");

let canvasData = new Array(625).fill(0);
let isDrawing = false;
let isClearing = false;

canvas.onmousemove = (e) => {
    if (
        isDrawing &&
        canvasData[
            Math.floor(e.offsetX / CELL_SIZE) +
                Math.floor(e.offsetY / CELL_SIZE) * 25
        ] !== 1
    ) {
        canvasData[
            Math.floor(e.offsetX / CELL_SIZE) +
                Math.floor(e.offsetY / CELL_SIZE) * 25
        ] = 1;
        inputCanvasCtx.fillStyle = "red";
        inputCanvasCtx.fillRect(
            Math.floor(e.offsetX / CELL_SIZE) * CELL_SIZE,
            Math.floor(e.offsetY / CELL_SIZE) * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
        let results = nn.feedForward(canvasData);
        resultCanvasCtx.fillStyle = "red";
        resultCanvasCtx.clearRect(0, 0, 100, CANVAS_SIZE);
        results.forEach((item, index) => {
            resultCanvasCtx.fillRect(
                0,
                index * (CANVAS_SIZE / 10),
                Math.floor(item * 100),
                CANVAS_SIZE / 10
            );
        });
        resultP.innerText =
            "Результат: " +
            results.reduce(
                (res, item, index) => {
                    if (res[0] < item) {
                        res[0] = item;
                        res[1] = index;
                    }
                    return res;
                },
                [0, 0]
            )[1];
    }
    if (
        isClearing &&
        canvasData[
            Math.floor(e.offsetX / CELL_SIZE) +
                Math.floor(e.offsetY / CELL_SIZE) * 25
        ] !== 0
    ) {
        canvasData[
            Math.floor(e.offsetX / CELL_SIZE) +
                Math.floor(e.offsetY / CELL_SIZE) * 25
        ] = 0;
        inputCanvasCtx.fillStyle = "#171723";
        inputCanvasCtx.fillRect(
            Math.floor(e.offsetX / CELL_SIZE) * CELL_SIZE,
            Math.floor(e.offsetY / CELL_SIZE) * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );

        let results = nn.feedForward(canvasData);
        resultCanvasCtx.fillStyle = "red";
        resultCanvasCtx.clearRect(0, 0, 100, CANVAS_SIZE);
        results.forEach((item, index) => {
            resultCanvasCtx.fillRect(
                0,
                index * (CANVAS_SIZE / 10),
                Math.floor(item * 100),
                CANVAS_SIZE / 10
            );
        });
        resultP.innerText =
            "Результат: " +
            results.reduce(
                (res, item, index) => {
                    if (res[0] < item) {
                        res[0] = item;
                        res[1] = index;
                    }
                    return res;
                },
                [0, 0]
            )[1];
    }
};

canvas.onmousedown = (e) => {
    e.preventDefault();
    if (e.buttons === 1) isDrawing = true;
    if (e.buttons === 2) isClearing = true;
};

document.oncontextmenu = (e) => false;

document.onmouseup = (e) => {
    isDrawing = false;
    isClearing = false;
};

canvasClear.onclick = (e) => {
    e.preventDefault();
    canvasData = new Array(625).fill(0);
    inputCanvasCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    resultCanvasCtx.clearRect(0, 0, 100, CANVAS_SIZE);
    resultP.innerHTML = "Результат: ?";
};

