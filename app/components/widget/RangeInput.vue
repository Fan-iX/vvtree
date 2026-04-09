<script setup>
import { computed, ref, watch } from 'vue'
const { modelValue, variant, min, max, disabled } = defineProps({
    modelValue: { type: Array },
    variant: { type: String, default: "underline" },
    min: null, max: null, disabled: null
})
const emit = defineEmits(['update:modelValue'])
const min_val = ref(modelValue?.[0] ?? 0)
const max_val = ref(modelValue?.[1] ?? 0)
const step = computed(() => 10 ** (Math.floor(Math.log10((modelValue?.[1] ?? 0) - (modelValue?.[0] ?? 0))) - 2) || 1)
watch(() => modelValue, (v) => {
    let step = 10 ** (Math.floor(Math.log10((v?.[1] ?? 0) - (v?.[0] ?? 0))) - 2) || 1
    min_val.value = round(v?.[0] ?? 0, step)
    max_val.value = round(v?.[1] ?? 0, step)
}, { immediate: true, deep: true })
function min_change(e) {
    min_val.value = round(+e.target.value, step.value)
    emit('update:modelValue', [min_val.value, modelValue?.[1] ?? 0])
}
function max_change(e) {
    max_val.value = round(+e.target.value, step.value)
    emit('update:modelValue', [modelValue?.[0] ?? 0, max_val.value])
}
function round(x, delta) {
    return +x.toFixed(Math.min(Math.max(0, 2 - Math.floor(Math.log10(delta))), 10))
}
const className = computed(() => [
    disabled ? "opacity-50 cursor-not-allowed" : "",
    variant == "outline" ? "border border-gray-300" : "outline-none",
])
const inputClass = computed(() => [
    "appearance-none field-sizing-content bg-transparent",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:border-none",
    "outline-none",
    variant == "underline" ? "border-b outline-none" : "",
    variant == "leftline" ? "border-l outline-none" : "",
])
</script>
<template>
    <span class="inline-flex flex-row items-baseline min-w-0" :class="className" v-tw-merge>
        <input :class="inputClass" :disabled="disabled" :step="step" @change="min_change" type="number" :value="min_val"
            :max="max_val" :min="min" class="flex-1 min-w-0" />
        –
        <input :class="inputClass" :disabled="disabled" :step="step" @change="max_change" type="number" :value="max_val"
            :min="min_val" :max="max" class="flex-1 min-w-0" />
    </span>
</template>
