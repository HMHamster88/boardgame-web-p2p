<template>
    <Dialog v-model:visible="showDialog" modal header="Edit Game">
        <template #default>
            <div>
                <Button v-on:click="scrollTo(goToText)">Find</Button>
                <InputText class="ml-2" autocomplete="off" v-model="goToText" />
            </div>
            <Textarea class="mt-2" v-model="json" rows="15" cols="60" ref="textArea" />
        </template>
        <template #footer>
            <Button type="button" :label="$t('cancel')" severity="secondary" @click="close(false)"></Button>
            <Button type="button" :label="$t('ok')" @click="close(true)"></Button>
        </template>

    </Dialog>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

const textArea = useTemplateRef('textArea')

const showDialog = ref(false)

const json = ref('')

const goToText = ref('privateState')

function getLineNumber(text: string, charIndex: number): number {
    if (charIndex < 0 || charIndex > text.length) {
        return -1;
    }

    const subBody = text.substring(0, charIndex);
    const matches = subBody.match(/\n/gi);
    return matches ? matches.length + 1 : 1;
}

function scrollTo(string: string) {
    if (!textArea.value) {
        return
    }
    const element = (textArea.value as any).$el as HTMLTextAreaElement
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const startIndex = element.selectionEnd == json.value.length ? 0 : element.selectionEnd
    let wordIndex = json.value.indexOf(string, startIndex)
    if (wordIndex < 0) {
        wordIndex = json.value.indexOf(string)
    }
    const lineNumber = getLineNumber(json.value, wordIndex)

    element.setSelectionRange(wordIndex, wordIndex + string.length)
    element.focus();
    element.scrollTop = (lineNumber - 1) * lineHeight;
}

let resolvePromise: (value: string | undefined) => void;

async function open(obj: any): Promise<string | undefined> {
    showDialog.value = true
    json.value = JSON.stringify(obj, null, 1)
    return new Promise((resolve) => {
        resolvePromise = resolve;
    });
}

function close(result: boolean) {
    showDialog.value = false
    if (result) {
        resolvePromise(json.value)
    } else {
        resolvePromise(undefined)
    }
}

defineExpose({
    open
})

</script>