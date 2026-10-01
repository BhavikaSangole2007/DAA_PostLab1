const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const thresholdText = document.getElementById("threshold");
const iterationText = document.getElementById("iteration");
const statusText = document.getElementById("status");

const iterationLog = document.getElementById("iterationLog");


const nodes = [
    "S",
    "A",
    "D",
    "E",
    "B",
    "F",
    "G",
    "C",
    "H",
    "Goal"
];


let running = false;
let timer;


/* Clear all node effects */

function clearNodes() {

    nodes.forEach(id => {

        const node = document.getElementById(id);

        node.classList.remove(
            "active",
            "visited",
            "rejected",
            "found"
        );

    });

}


/* Reset */

function resetVisualizer() {

    clearInterval(timer);

    running = false;

    clearNodes();

    thresholdText.textContent = "5";
    iterationText.textContent = "0";
    statusText.textContent = "Ready";

    iterationLog.innerHTML = `
        <p>
            <span>Threshold = 5</span>
            <span>Waiting...</span>
        </p>
    `;

    startBtn.disabled = false;
}


/* Add iteration message */

function addLog(threshold, message) {

    const row = document.createElement("p");

    row.innerHTML = `
        <span>Threshold = ${threshold}</span>
        <span>${message}</span>
    `;

    iterationLog.appendChild(row);
}


/* Highlight node */

function highlight(id, type = "active") {

    const node = document.getElementById(id);

    if (!node) return;

    node.classList.add(type);
}


/* Start IDA* */

function startSearch() {

    if (running) return;

    running = true;
    startBtn.disabled = true;

    clearNodes();

    iterationLog.innerHTML = "";

    let step = 0;

    const sequence = [

        {
            threshold: 5,
            iteration: 1,
            node: "S",
            message: "Searching..."
        },

        {
            threshold: 5,
            iteration: 1,
            node: "A",
            message: "Node A within threshold"
        },

        {
            threshold: 5,
            iteration: 1,
            node: "D",
            message: "Node D visited"
        },

        {
            threshold: 5,
            iteration: 1,
            node: "E",
            message: "f(E) exceeds threshold"
        },

        {
            threshold: 7,
            iteration: 2,
            node: "B",
            message: "Threshold increased"
        },

        {
            threshold: 7,
            iteration: 2,
            node: "F",
            message: "Node F visited"
        },

        {
            threshold: 7,
            iteration: 2,
            node: "G",
            message: "f(G) exceeds threshold"
        },

        {
            threshold: 9,
            iteration: 3,
            node: "C",
            message: "Threshold increased"
        },

        {
            threshold: 9,
            iteration: 3,
            node: "H",
            message: "Node H visited"
        },

        {
            threshold: 9,
            iteration: 3,
            node: "Goal",
            message: "Goal Found!"
        }

    ];


    timer = setInterval(() => {

        if (step >= sequence.length) {

            clearInterval(timer);

            running = false;
            startBtn.disabled = false;

            statusText.textContent = "Goal Found ✓";

            return;
        }


        const current = sequence[step];


        thresholdText.textContent = current.threshold;

        iterationText.textContent = current.iteration;

        statusText.textContent = current.message;


        clearNodes();


        /*
         * Highlight all previously visited nodes
         */

        for (let i = 0; i < step; i++) {

            const previous = sequence[i];

            if (previous.node !== "Goal") {

                const previousNode =
                    document.getElementById(previous.node);

                if (previousNode) {
                    previousNode.classList.add("visited");
                }

            }

        }


        /*
         * Highlight current node
         */

        if (current.node === "Goal") {

            highlight("Goal", "found");

        } else {

            highlight(current.node, "active");

        }


        /*
         * Add important iteration messages
         */

        if (
            current.node === "A" ||
            current.node === "B" ||
            current.node === "C"
        ) {

            addLog(
                current.threshold,
                current.message
            );

        }


        if (current.node === "Goal") {

            addLog(
                current.threshold,
                "✓ Goal found"
            );

        }


        step++;

    }, 1000);

}


/* Button events */

startBtn.addEventListener(
    "click",
    startSearch
);

resetBtn.addEventListener(
    "click",
    resetVisualizer
);
