<script setup>
import { computed, ref, watch } from 'vue'
const {
    modelValue, value, variant, placeholder, ...props
} = defineProps({
    modelValue: null, value: null,
    placeholder: String,
    variant: { type: String, default: "underline" },
    options: { type: Array, default: () => [] },
    labelAttribute: { default: 'label' },
    valueAttribute: { default: 'value' },
    titleAttribute: { default: 'title' },
})
const emit = defineEmits(['update:modelValue'])
const model = computed({
    get() { return modelValue ?? value },
    set() { }
})
function get_attr(obj, attr) {
    if (typeof attr == 'function') return attr(obj)
    return obj[attr]
}
const options = computed(() => {
    let result = Array.from(props.options ?? []).map(opt => {
        let value, label, title, disabled = false
        if (typeof opt != 'object' || opt == null) {
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
            label = get_attr(opt, props.labelAttribute)
            title = get_attr(opt, props.titleAttribute)
            disabled = get_attr(opt, 'disabled')
        }
        return { value, label, title, disabled }
    })
    if (result.every(opt => opt.value != model.value)) {
        result.unshift({ disabled: true, value: model.value, label: String(model.value ?? placeholder ?? " ") })
    }
    result.forEach((opt, i) => {
        opt.id = i
        if (opt.label == null) opt.label = String(opt.value)
        if (opt.label == "") opt.label = " "
    })
    return result
})
const id = ref(0)
watch([options, model], ([opts, m]) => {
    if (opts.length == 0) return
    id.value = opts.find(opt => opt.value == m)?.id ?? 0
}, { immediate: true })
function selectchange(e) {
    emit('update:modelValue', options.value[id.value]?.value)
}
const className = computed(() => [
    "appearance-none min-w-[1ex] field-sizing-content bg-transparent",
    "disabled:opacity-50 disabled:border-none disabled:cursor-not-allowed",
    variant == "underline" ? "border-b" : "",
    variant == "leftline" ? "border-l" : "",
    options.value[id.value].disabled ? "opacity-50" : "",
])
</script>
<template>
    <select :class="className" v-model="id" @change="selectchange" v-tw-merge>
        <option v-for="opt in options" :value="opt.id" :title="opt.title" :disabled="opt.disabled">
            {{ opt.label.replace(/\s/g, "&nbsp;") }}
        </option>
    </select>
</template>
