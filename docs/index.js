/**
 * @typedef {object} Modulator
 * @property {ModulatorType} type
 * @property {number} frequency
 * @property {number} amplitude
 * @property {Modulator|null} frequencyModulator
 * @property {Modulator|null} amplitudeModulator
 * @property {(time: number) => number} sample
 */
undefined

/**
 * @typedef {"sawtooth"|"sine"|"square"} ModulatorType
 */
undefined

/**
 * @typedef {object} State
 * @property {number} phase
 * @property {number} time
 * @property {number} timebase
 * @property {boolean} running
 * @property {number[]} points
 * @property {Modulator[]} modulators
 */
undefined

const canvasWidth = 320
const canvasHeight = 240
const canvasFrameRate = 15
const canvasElement = document.querySelector("canvas")
const canvasContext = canvasElement.getContext("2d", {
    desynchronized: true
})
const infoElement = document.querySelector("span.info")

/**
 * @param {ModulatorType} type
 * @param {number} frequency
 * @param {number} amplitude
 * @returns {Modulator}
 */
function createModulator(type, frequency, amplitude = 0.8) {
    /** @type {Modulator} */
    const instance = {
        type,
        frequency,
        amplitude,
        frequencyModulator: null,
        amplitudeModulator: null,

        sample: (time) => {
            let phase = 0.0
            let value = 0.0
            let frequency = instance.frequency
            let amplitude = instance.amplitude

            if (instance.frequencyModulator !== null) {
                frequency = frequency * instance.frequencyModulator.sample(time)
            }

            if (instance.amplitudeModulator !== null) {
                amplitude = amplitude * instance.amplitudeModulator.sample(time)
            }

            phase = (time * frequency) % 1.0

            if (instance.type === "sine") {
                value = Math.sin(Math.PI * 2.0 * phase)
            }

            return value * amplitude
        }
    }

    return instance
}

/** */
function initialize() {
    let state = {
        phase: 0,
        time: 0,
        timebase: 0,
        points: [],
        modulators: []
    }

    for (let i = 0; i < canvasWidth; i ++) {
        state.points[i] = 0.0
    }

    state.modulators[0] = createModulator("sine", 0.5, 0.8)
    state.modulators[0].amplitudeModulator = createModulator("sine", 0.4, 0.5)
    state.modulators[0].frequencyModulator = createModulator("sine", 0.2, 0.5)

    resize()
    render(state)
    update(state)

    let mainElement = document.querySelector("main")

    mainElement.hidden = false

    window.addEventListener("resize", (event) => {
        if (event.isTrusted) {
            resize()
        }
    })
}

/** */
function resize() {
    let width = 0
    let height = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
        let nextWidth = width + canvasWidth
        let nextHeight = height + canvasHeight
        let containerWidth = document.documentElement.clientWidth - 80
        let containerHeight = document.documentElement.clientHeight - 160

        if (nextWidth < containerWidth && nextHeight < containerHeight) {
            width = nextWidth
            height = nextHeight
            continue
        }

        break
    }

    canvasElement.width = canvasWidth
    canvasElement.height = canvasHeight
    canvasElement.style.width = width + "px"
    canvasElement.style.height = height + "px"
}

/**
 * @param {State} state
 */
function update(state) {
    window.requestAnimationFrame(() => update(state))

    if (state.timebase === 0.0) {
        state.timebase = window.performance.now()
        return
    }

    if (state.phase >= 60 / canvasFrameRate) {
        state.phase = 0
        state.time = (window.performance.now() - state.timebase) * 0.001

        render(state)

        infoElement.innerText = state.time.toFixed(2)
    }

    state.phase ++
}

/**
 * @param {State} state
 */
function render(state) {
    canvasContext.fillStyle = "rgb(17, 18, 18)"
    canvasContext.fillRect(0, 0, canvasWidth, canvasHeight)
    canvasContext.fillStyle = "rgb(180, 160, 120)"

    for (let i = 0; i < state.points.length; i ++) {
        let value = 0.0
        let phase = (1.0 / state.points.length) * i

        for (let j = 0; j < state.modulators.length; j ++) {
            value = value + state.modulators[j].sample(state.time + phase)
        }

        if (value < -0.9) {
            value = -0.9
        } else if (value > 0.9) {
            value = 0.9
        }

        let x = i
        let y = ((canvasHeight * 0.5) + (canvasHeight * 0.5 * value)) | 0

        canvasContext.fillRect(x - 2, y - 2, 5, 5)
    }
}

initialize()
