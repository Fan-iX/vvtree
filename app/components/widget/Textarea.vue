<script setup>
import { nextTick, watch, computed, useTemplateRef } from 'vue'
import { useResizeObserver } from '@vueuse/core'
const { modelValue, value, variant, autosize, modelModifiers } = defineProps({
    modelValue: null, value: null,
    modelModifiers: { default: () => ({}) },
    variant: { type: String, default: "outline" },
    autosize: Boolean,
})
const emit = defineEmits(['update:modelValue'])
const className = computed(() => [
    "font-mono break-anywhere resize-none leading-none",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "read-only:bg-current/3",
    variant == "outline" ? "border border-gray-300" : "outline-none",
    autosize ? "overflow-y-hidden" : ""
])
const textarea = useTemplateRef('textarea')
function updateSize() {
    if (!autosize) return
    nextTick(() => {
        let ele = textarea.value
        if (!ele) return
        let _height = ele.style.height
        ele.style.minHeight = null
        ele.style.height = "auto"
        let _scrollbarHeight = 0
        let style = getComputedStyle(ele)
        if (ele.scrollWidth > ele.clientWidth) {
            _scrollbarHeight = ele.offsetHeight - ele.clientHeight - (parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth))
        }
        ele.style.height = "1px"
        if (style.boxSizing === "border-box") {
            let _borderHeight = ele.offsetHeight - ele.clientHeight
            ele.style.minHeight = `${ele.scrollHeight + _borderHeight + _scrollbarHeight}px`
        } else {
            let _paddingHeight = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
            ele.style.minHeight = `${ele.scrollHeight - _paddingHeight + _scrollbarHeight}px`
        }
        ele.style.height = _height
    })
}
function onchange(e) {
    if (modelModifiers.lazy) emit('update:modelValue', e.target.value)
}
function oninput(e) {
    updateSize()
    if (!modelModifiers.lazy) emit('update:modelValue', e.target.value)
}
const model = computed({
    get() { return modelValue ?? value },
    set() { }
})
watch([model], updateSize, { immediate: true })
useResizeObserver(textarea, updateSize)
</script>
<template>
    <textarea ref="textarea" v-model="model" @input="oninput" @change="onchange" :class="className"
        v-tw-merge></textarea>
</template>
