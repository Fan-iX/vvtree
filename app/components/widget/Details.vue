<script setup>
import { computed } from 'vue'
const open = defineModel("open", { type: Boolean, default: false })
const { class: $class, summaryClass, hardClip } = defineProps({
    class: { type: String, default: '' }, summaryClass: null, hardClip: Boolean
})
const className = computed(() => {
    let cls = $class.split(/\s+/)
    return [
        "flex flex-col",
        cls.includes("overflow-auto") ? "[&::details-content]:overflow-auto overflow-hidden" : "",
    ].concat(cls.filter(c => c != "overflow-auto"))
})
</script>
<template>
    <details :open :class="className" v-tw-merge>
        <summary @click.prevent class="marker:content-['']" :class="summaryClass">
            <div class="contents" @click="open = !open">
                <slot name="trigger" :open>
                    <Icon icon="lucide:chevron-right"
                        class="text-lg cursor-pointer duration-200 inline-block align-middle"
                        :class="{ 'rotate-90': open }" />
                </slot>
            </div>
            <slot name="summary" :open></slot>
        </summary>
        <template v-if="!hardClip || open">
            <slot></slot>
        </template>
    </details>
</template>
