<script setup>
import { computed } from 'vue'
const {
    modelValue, value, variant, type, coalesce, modelModifiers,
    placeholder, disabled, selectonly,
    ...props
} = defineProps({
    modelValue: null, value: null, coalesce: null,
    modelModifiers: { default: () => ({}) },
    variant: { type: String, default: "underline" },
    type: { type: String, default: "text" },
    placeholder: String, disabled: Boolean, selectonly: Boolean,
    options: { type: Array, default: () => [] },
    labelAttribute: { default: 'label' },
    valueAttribute: { default: 'value' },
    titleAttribute: { default: 'title' },
})
const emit = defineEmits(['change', 'update:modelValue'])
const model = computed({
    get() {
        let val = modelValue ?? value
        if (modelModifiers.int && val != null) val = Math.round(val)
        return val
    },
    set() { }
})
function get_attr(obj, attr) {
    if (typeof attr == 'function') return attr(obj)
    return obj[attr]
}
const options = computed(() => {
    let result = Array.from(props.options).map(opt => {
        let value, label, title, disabled = false
        if (typeof opt != 'object') {
            value = opt
            if (typeof props.labelAttribute == 'function') {
                label = props.labelAttribute(opt)
            } else {
                label = String(opt)
            }
            if (typeof props.titleAttribute == 'function') {
                title = props.titleAttribute(opt)
            }
        } else {
            if (props.valueAttribute == null) {
                value = opt
            } else {
                value = get_attr(opt, props.valueAttribute)
            }
            value = get_attr(opt, props.valueAttribute)
            label = get_attr(opt, props.labelAttribute)
            title = get_attr(opt, props.titleAttribute)
            disabled = get_attr(opt, 'disabled')
        }
        return { value, label, title, disabled }
    })
    if (result.every(opt => opt.value != model.value)) {
        result.unshift({ value: model.value, label: String(model.value ?? placeholder ?? " ") })
    }
    result.forEach((opt, i) => {
        opt.id = i
        if (opt.label == null) opt.label = String(opt.value)
        if (opt.label == "") opt.label = " "
    })
    return result
})
const id = computed({
    get: () => options.value.find(opt => opt.value == model.value)?.id,
    set: (v) => {
        emit('update:modelValue', options.value[v]?.value)
    }
})
function onchange(e) {
    emit('change', e)
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
const className = computed(() => [
    "relative inline-block whitespace-nowrap",
    variant == "underline" ? "border-b border-current" : "",
    variant == "leftline" ? "border-l border-current" : "",
    disabled ? "opacity-50 border-none" : "",
])
const selectClassName = computed(() => [
    "absolute left-0 w-full appearance-none field-sizing-content min-w-[2em] h-[1.5em] text-transparent",
    "disabled:cursor-not-allowed",
])
const inputClassName = computed(() => [
    "relative appearance-none min-w-[1em] field-sizing-content h-[1.5em] bg-transparent",
    "disabled:cursor-not-allowed",
    "read-only:outline-none",
])
</script>
<template>
    <span :class="className" v-tw-merge>
        <select :class="selectClassName" v-model="id" @change="emit('change', $event)" :disabled v-tw-merge>
            <option v-for="opt in options" :value="opt.id" :title="opt.title" :disabled="opt.disabled"
                class="text-black">
                {{ opt.label.replace(/ /g, "&nbsp;") }}
            </option>
        </select>
        <input :class="inputClassName" v-model="model" @input="oninput" @change="onchange" :type :placeholder
            :readonly="selectonly" :disabled v-tw-merge />
        <span class="relative pointer-events-none">▼</span>
    </span>
</template>
