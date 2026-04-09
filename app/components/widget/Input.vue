<script setup>
import { computed } from 'vue'
const {
    modelValue, value, variant, coalesce, placeholder, modelModifiers,
    type, step, min, max,
} = defineProps({
    modelValue: null, value: null, coalesce: null, placeholder: null,
    modelModifiers: { default: () => ({}) },
    variant: { type: String, default: "underline" },
    type: String, step: null, min: null, max: null,
})
const emit = defineEmits(['update:modelValue'])
const className = computed(() => [
    "appearance-none field-sizing-content bg-transparent",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:border-none",
    "read-only:bg-current/3",
    type == "number" ? "min-w-6" : "min-w-4",
    variant == "outline" ? "border border-gray-300" : "outline-none",
    variant == "underline" ? "border-b outline-none" : "",
    variant == "leftline" ? "border-l outline-none" : "",
])
function onfocus(e) {
    if (modelModifiers.hold && (modelValue ?? value) == null) {
        emit('update:modelValue', placeholder)
    }
}
function onchange(e) {
    if (!modelModifiers.lazy) return
    let val = e.target.value
    if (val === "") val = coalesce
    else if (modelModifiers.int || modelModifiers.number || type == "number") val = Number(val)
    if (Number.isNaN(val)) val = coalesce
    emit('update:modelValue', val)
}
function oninput(e) {
    if (modelModifiers.lazy) return
    let val = e.target.value
    if (val === "") val = coalesce
    else if (modelModifiers.int || modelModifiers.number || type == "number") val = Number(val)
    if (Number.isNaN(val)) val = coalesce
    emit('update:modelValue', val)
}
function onwheel(e) {
    if (step) {
        e.preventDefault()
        let val = modelValue ?? value ?? +(placeholder ?? 0)
        val += step * -Math.sign(e.deltaY)
        if (modelModifiers.int) val = Math.round(val)
        if (val < min) val = min
        if (val > max) val = max
        if (!isNaN(val)) emit('update:modelValue', val)
    }
}
const model = computed({
    get() {
        let val = modelValue ?? value
        if (modelModifiers.int && val != null) val = Math.round(val)
        return val
    },
    set() { }
})
</script>
<template>
    <input :class="className" v-model="model" @input="oninput" @change="onchange" @wheel="onwheel" @focus="onfocus"
        :placeholder="placeholder" :type="type" :step="step" :min="min" :max="max" v-tw-merge />
</template>
