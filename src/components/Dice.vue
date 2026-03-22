<template>
    <div class="dice-container">
        <div class="dice" id="dice" ref="dice">
            <div class="face front">
                <div class="dot center big"></div>
            </div>
            <div class="face back">
                <div class="dot dtop dleft"></div>
                <div class="dot dbottom dright"></div>
            </div>
            <div class="face right">
                <div class="dot dtop dleft"></div>
                <div class="dot center"></div>
                <div class="dot dbottom dright"></div>
            </div>
            <div class="face left">
                <div class="dot dtop dleft"></div>
                <div class="dot dtop dright"></div>
                <div class="dot dbottom dleft"></div>
                <div class="dot dbottom dright"></div>
            </div>
            <div class="face top">
                <div class="dot dtop dleft small"></div>
                <div class="dot dtop dright small"></div>
                <div class="dot dbottom dleft small"></div>
                <div class="dot dbottom dright small"></div>

                <div class="dot dright center small"></div>
                <div class="dot dleft center small"></div>
            </div>
            <div class="face bottom">
                <div class="dot dtop dleft"></div>
                <div class="dot dtop dright"></div>
                <div class="dot dbottom dleft"></div>
                <div class="dot dbottom dright"></div>
                <div class="dot center"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue';

interface Rotaton {
    x: number
    y: number
}

const diceElement = useTemplateRef('dice')

const resultRotations: Rotaton[] = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 180 },
    { x: 0, y: -90 },
    { x: 0, y: 90 },
    { x: 90, y: 0 },
    { x: -90, y: 0 }
]

const props = defineProps({
    size: {
        type: Number,
        default: 50
    },
    color: {
        type: String,
        default: '#FFFFFF'
    },
    borderColor: {
        type: String,
        default: '#ff6b81'
    },
    dotSize: {
        type: Number,
        default: 12
    },
    result: {
        type: Number,
        default: 1
    }
})

let intervalId: any

function starRollingAnimation() {
    if (!diceElement.value) {
        return
    }
    const style = diceElement.value.style
    style.transition = "transform 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)"
    const randomX = Math.floor(Math.random() * 720) + 360;
    const randomY = Math.floor(Math.random() * 720) + 360;
    style.transform = `rotateX(${randomX}deg) rotateY(${randomY}deg)`
}

watch(() => props.result, (newVal) => {
    if (!diceElement.value) {
        return
    }
    const style = diceElement.value.style
    if (newVal == 0) {
        starRollingAnimation()
        intervalId = setInterval(() => starRollingAnimation(), 1500)

    } else {
        clearInterval(intervalId)
        const resultRotation = resultRotations[props.result]!
        style.transition = "transform 0.5s ease-out"
        style.transform = `rotateX(${resultRotation.x}deg) rotateY(${resultRotation.y}deg)`
    }
})

// @ts-ignore
const smallDotSize = computed(() => {
    return props.dotSize * 0.85
})

// @ts-ignore
const bigDotSize = computed(() => {
    return props.dotSize * 1.2
})

// @ts-ignore
const halfSize = computed(() => {
    return props.size / 2
})

// @ts-ignore
function px(num: number) {
    return num + 'px'
}

</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

.dice-container {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.dice {
    width: v-bind(px(size));
    height: v-bind(px(size));
    position: relative;
    transform-style: preserve-3d;
}

.face {
    position: absolute;
    width: v-bind(px(size));
    height: v-bind(px(size));
    background-color: v-bind(color);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 3.5em;
    font-weight: bold;
    color: #ff6b81;
    box-shadow: inset 0 0 10px #00000024;
    border-radius: 10px;
}

.front {
    transform: translateZ(v-bind((px(halfSize))));
}

.back {
    transform: translateZ(v-bind(px(-halfSize))) rotateY(180deg);
}

.right {
    transform: rotateY(90deg) translateZ(v-bind((px(halfSize))));
}

.left {
    transform: rotateY(-90deg) translateZ(v-bind((px(halfSize))));
}

.top {
    transform: rotateX(90deg) translateZ(v-bind((px(halfSize))));
}

.bottom {
    transform: rotateX(-90deg) translateZ(v-bind((px(halfSize))));
}

.dot {
    position: absolute;
    width: v-bind(px(dotSize));
    height: v-bind(px(dotSize));
    border-radius: v-bind(px(dotSize));
    background: #585858;
    box-shadow: inset v-bind(px(dotSize / 2)) v-bind(px(dotSize / 2)) v-bind(px(dotSize / 4)) #000;
}

.dot.center {
    margin: 0 0 0 0;
}

.dot.dtop {
    margin-top: v-bind(px(-halfSize));
}

.dot.dleft {
    margin-left: v-bind(px(-halfSize));
}

.dot.dright {
    margin-left: v-bind(px(halfSize));
}

.dot.dbottom {
    margin-top: v-bind(px(halfSize));
}

.dot.center.dleft {
    margin: 0 0 0 v-bind(px(-halfSize));
}

.dot.center.dright {
    margin: 0 0 0 v-bind(px(halfSize));
}

.dot.small {
    width: v-bind(px(smallDotSize));
    height: v-bind(px(smallDotSize));
}

.dot.big {
    width: v-bind(px(bigDotSize));
    height: v-bind(px(bigDotSize));
}
</style>