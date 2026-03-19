<template>
    <div style="width: 100%;">
        <div v-if="gameState.phase == CahGamePhase.ACTIVE_PLAYER_CHOOSE_ANSWERS">
            <ul class="white-card-container">
                <li v-for="qaCard in questionAnswersCards" :class="qaCardClassStyle(qaCard)"
                    v-on:click="selectQACard(qaCard)" v-html="qaCard.text">
                </li>
            </ul>
            <Button v-if="isLocalPlayerTurn" v-on:click="submitQA" :disabled="submitQaDisabled">$t('submit')</Button>
        </div>
        <div class="flex items-center" style="flex-direction: column"
            v-if="gameState.phase == CahGamePhase.PLAYERS_CHOOSE_ANSWERS">
            <div class="red-card" v-html="modifiedQuestionText">
            </div>
            <div v-if="!isLocalPlayerTurn" style="width: 100%;">
                <ul class="white-card-container">
                    <li v-for="answerCard in playerAnswersCards" :class="answerCardClassStyle(answerCard)"
                        v-on:click="selectAnswerCard(answerCard)">
                        {{ answerCard.text }}
                    </li>
                </ul>
                <Button v-on:click="submitAnswers" :disabled="submitAnswersDisabled">{{ $t('submit') }}</Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue';
import { CahGamePhase, cahPlayerCardsCount, type CahGamePublicState, type CahPrivatePlayerState, type CahSelectAnswerAction, type CahSendAnswersAction, type PlayerAnswers } from '../cahTypes';
import type Game from '../../../db/game';
import type { GameAction } from '../../../services/messages';
import questions from '../texts/questions';
import answers from '../texts/answers';

interface AnswerCard {
    id: number
    text: string
}

interface QuestionAnswerCard {
    playerId: string,
    text: string
}

const selectedQaCard = ref<QuestionAnswerCard | null>(null)

const submitQaDisabled = computed(() => {
    return !selectedQaCard.value
})

function submitQA() {
    const action: CahSelectAnswerAction = {
        type: 'CahSelectAnswerAction',
        playerId: selectedQaCard.value?.playerId!
    }
    emit('performAction', action)
    selectedQaCard.value = null
}

function qaCardClassStyle(qaCard: QuestionAnswerCard) {
    return {
        "hand-pointer": true,
        "red-card": true,
        "selected-qa-card": selectedQaCard.value?.playerId == qaCard.playerId && isLocalPlayerTurn
    }
}

function selectQACard(card: QuestionAnswerCard) {
    if (!isLocalPlayerTurn.value) {
        return
    }
    selectedQaCard.value = card
}

const questionAnswersCards = computed(() => {
    if (props.gameState.phase != CahGamePhase.ACTIVE_PLAYER_CHOOSE_ANSWERS) {
        return []
    }
    const playersAnswers = props.gameState.playersSlectedAswers

    return playersAnswers.map((playerAnswer: PlayerAnswers) => {
        return {
            playerId: playerAnswer.playerId,
            text: replacePlaceholders(questionText.value!, playerAnswer.answersIds.map(id => answers[id]!))
        } as QuestionAnswerCard
    })
})

const isLocalPlayerTurn = computed(() => {
    return props.localPlayerIndex == props.gameState.activePlayerIndex
})

function submitAnswers() {
    const action: CahSendAnswersAction = {
        type: 'CahSendAnswersAction',
        answersIds: selectedAnswers.value.map(answer => answer.id)
    }
    emit('performAction', action)
    selectedAnswers.value = []
}

const submitAnswersDisabled = computed(() => {
    return selectedAnswers.value.length != requiredAnswersCount.value || props.playerPrivateState.onHandAswersIds.length != cahPlayerCardsCount
})

function countOccurrences(mainString: string, subString: string): number {
    const regex = new RegExp(subString, 'gi');
    const matches = mainString.match(regex);
    return matches ? matches.length : 0;
}

const questionText = computed(() => {
    return questions[props.gameState.questionCardId]
})

function replacePlaceholders(text: string, toReplaceList: string[]) {
    const regex = new RegExp('{}', 'i');

    let result = text

    toReplaceList.forEach(toReplace => {
        result = result.replace(regex, '<span class="underline">' + toReplace + '</span>');
    })
    return result
}

const modifiedQuestionText = computed(() => {
    if (!questionText.value) {
        return null
    }
    const toReplaceList = Array.from({ length: requiredAnswersCount.value }, (_v, i) => i)
        .map(i => {
            if (selectedAnswers.value.length > i) {
                return selectedAnswers.value[i]?.text!
            }
            return '_______'
        })
    return replacePlaceholders(questionText.value, toReplaceList)
})

const requiredAnswersCount = computed(() => {
    if (!questionText.value) {
        return 0
    }
    return countOccurrences(questionText.value, '{}')
})

const selectedAnswers = ref<AnswerCard[]>([])

function answerCardClassStyle(answerCard: AnswerCard) {
    return {
        "hand-pointer": true,
        "white-card": true,
        "selected-card": selectedAnswers.value.map(a => a.id).includes(answerCard.id)
    }
}

const playerAnswersCards = computed(() => {
    const answerIds = props.playerPrivateState.onHandAswersIds ?
        props.playerPrivateState.onHandAswersIds : []

    return answerIds.map(id => {
        return {
            id: id,
            text: answers[id]!
        } as AnswerCard
    })
})

function selectAnswerCard(answerCard: AnswerCard) {
    const alreadeSelectedIndex = selectedAnswers.value.findIndex(answer => answer.id == answerCard.id)
    if (alreadeSelectedIndex >= 0) {
        selectedAnswers.value.splice(alreadeSelectedIndex, 1)
        return
    }

    if (selectedAnswers.value.length >= requiredAnswersCount.value) {
        selectedAnswers.value.pop()
    }
    selectedAnswers.value.push(answerCard)
}

const props = defineProps({
    game: {
        type: Object as PropType<Game>,
        required: true
    },
    gameState: {
        type: Object as PropType<CahGamePublicState>,
        required: true
    },
    playerPrivateState: {
        type: Object as PropType<CahPrivatePlayerState>,
        required: true
    },
    localPlayerIndex: {
        type: Number,
        required: true
    }
})

const emit = defineEmits<{
    (e: 'performAction', action: GameAction): void
}>()
</script>

<style scoped>
.red-card {
    background: rgb(255, 97, 97);
    border: var(--card-border);
    padding: 2rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    box-shadow: var(--p-card-shadow);
    height: 10rem;
    min-width: 20rem;
}

.white-card-container {
    display: flex;
    overflow: auto;
    width: 100%;
    gap: 1rem;
    padding-bottom: 1rem;
}

.white-card {
    background: rgb(255, 255, 255);
    border: 1px solid #dedede;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: var(--p-card-shadow);
    height: 10rem;
    flex: 0 0 25%;
}

.hand-pointer {
    cursor: pointer;
}

.selected-card {
    border: 3px solid #28ee00;
}

.selected-qa-card {
    border: 3px solid #5d00ff;
}

.underline {
    text-decoration: underline;
}
</style>