<script setup>
import { computed } from 'vue'
const { modelValue, palette, disabled } = defineProps({
    modelValue: String,
    palette: { type: Object, default: () => [] },
    disabled: Boolean,
})
const emit = defineEmits(['update:modelValue'])
const colorClassName = computed(() => [
    "flex-1 border-1 bg-current cursor-pointer",
    "disabled:cursor-not-allowed disabled:opacity-50",
])
let nullClass = 'bg-[linear-gradient(to_bottom_right,transparent_calc(50%-1px),red_50%,transparent_calc(50%+1px))]'
</script>
<template>
    <span class="inline-flex flex-row" v-tw-merge>
        <template v-for="color in palette">
            <button :class="[colorClassName, { 'border-black': color == modelValue, [nullClass]: color == null }]"
                :style="{ color: color ?? 'white' }" @click="emit('update:modelValue', color)" :title="String(color)"
                :disabled="disabled" v-tw-merge>&nbsp;</button>
        </template>
    </span>
</template>
