<script setup>
import { computed, ref, watch } from 'vue'
defineOptions({ inheritAttrs: false })
const {
    modelValue, variant, coalesce, modelModifiers,
    type, disabled, placeholder, checkboxClass, step, min, max,
} = defineProps({
    modelValue: null, value: null, coalesce: null,
    modelModifiers: { default: () => ({}) },
    variant: { type: String, default: "underline" },
    type: { type: String, default: "text" },
    disabled: Boolean,
    placeholder: null,
    checkboxClass: { type: String, default: "" },
    step: null, min: null, max: null,
})
const emit = defineEmits(['change', 'update:modelValue'])
const checkValue = ref(modelValue != null)
function oncheckchange(e) {
    emit('change', e)
    if (checkValue.value) {
        let val = modelModifiers.hold ? placeholder : inputValue.value
        if (modelModifiers.number) val = Number(val)
        if (Number.isNaN(val)) val = 0
        emit('update:modelValue', val)
    } else {
        if (modelModifiers.hold) inputValue.value = null
        emit('update:modelValue', coalesce)
    }
}
const inputValue = ref(modelValue ?? coalesce ?? null)
watch(() => modelValue, v => {
    inputValue.value = v
    checkValue.value = v != null
})
function onchange(e) {
    emit('change', e)
    if (!modelModifiers.lazy) return
    let val = e.target.value
    if (val === "") val = coalesce
    else if (modelModifiers.number) val = Number(val)
    if (Number.isNaN(val)) val = coalesce
    emit('update:modelValue', val)
}
function oninput(e) {
    if (modelModifiers.lazy) return
    let val = e.target.value
    if (val === "") val = coalesce
    else if (modelModifiers.number) val = Number(val)
    if (Number.isNaN(val)) val = coalesce
    emit('update:modelValue', val)
}
function onwheel(e) {
    if (checkValue.value && step) {
        e.preventDefault()
        let val = modelValue ?? +(placeholder ?? 0)
        val += step * -Math.sign(e.deltaY)
        if (modelModifiers.int) val = Math.round(val)
        if (val < min) val = min
        if (val > max) val = max
        if (!isNaN(val)) emit('update:modelValue', val)
    }
}
const className = computed(() => [
    "whitespace-nowrap",
    variant == "leftline" ? "border-l outline-none" : "",
])
const inputClassName = computed(() => [
    "appearance-none min-w-4 field-sizing-content bg-transparent",
    "disabled:opacity-50 disabled:border-none disabled:cursor-not-allowed",
    "read-only:bg-current/3",
    variant == "underline" ? "border-b outline-none" : "",
])
const checkboxClassName = computed(() => [
    "align-middle",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    checkboxClass
])
</script>
<template>
    <span :class="className" v-tw-merge>
        <input type="checkbox" v-model="checkValue" :class="checkboxClassName" :disabled="disabled"
            @change="oncheckchange" v-tw-merge>
        <slot></slot>
        <input :type v-model="inputValue" :disabled="disabled || !checkValue" :placeholder="placeholder" :step="step"
            :min="min" :max="max" :class="inputClassName" @input="oninput" @change="onchange" @wheel="onwheel"
            v-bind="$attrs" v-tw-merge />
    </span>
</template>
