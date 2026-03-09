<script setup>
import { computed } from 'vue'
const { modelValue, value, variant, coalesce, placeholder, modelModifiers } = defineProps({
    modelValue: null, value: null, coalesce: null, placeholder: null,
    modelModifiers: { default: () => ({}) },
    variant: { type: String, default: "underline" },
})
const emit = defineEmits(['update:modelValue'])
const className = computed(() => [
    "appearance-none min-w-4 field-sizing-content bg-transparent",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:border-none",
    "read-only:bg-current/3",
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
    else if (modelModifiers.int || modelModifiers.number) val = Number(val)
    if (Number.isNaN(val)) val = coalesce
    emit('update:modelValue', val)
}
function oninput(e) {
    if (modelModifiers.lazy) return
    let val = e.target.value
    if (val === "") val = coalesce
    else if (modelModifiers.int || modelModifiers.number) val = Number(val)
    if (Number.isNaN(val)) val = coalesce
    emit('update:modelValue', val)
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
    <input :class="className" v-model="model" @input="oninput" @change="onchange" @focus="onfocus"
        :placeholder="placeholder" v-tw-merge />
</template>
