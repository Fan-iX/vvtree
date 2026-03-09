<script setup>
import { computed, watch, nextTick, useTemplateRef } from 'vue'
import { useResizeObserver } from '@vueuse/core'
defineOptions({ inheritAttrs: false })
const { title, contentClass } = defineProps({
    title: String, contentClass: String
})
const open = defineModel('open', { type: Boolean })
const fold = defineModel('fold', { type: Boolean, default: false })
const top = defineModel('top', { type: Number, default: 20 })
const left = defineModel('left', { type: Number, default: 20 })
const width = defineModel('width', { type: Number, default: 200 })
const height = defineModel('height', { type: Number, default: 200 })
const className = computed(() => [
    "fixed bg-white rounded-lg z-30 border border-gray-300 shadow-lg overflow-auto flex flex-col outline-none",
    fold.value ? "resize-x" : "resize",
])
watch(open, v => nextTick(() => { if (v) panel.value.focus() }))
const style = computed(() => ({
    left: left.value ? left.value + "px" : null,
    top: top.value ? top.value + "px" : null,
    width: width.value ? width.value + "px" : null,
    height: !fold.value && height.value ? height.value + "px" : null,
}))
const panel = useTemplateRef('panel')
function onpointerdown(e) {
    e.preventDefault()
    e.target.setPointerCapture(e.pointerId)

    e.target.onpointermove = (ev) => {
        panel.value.style.opacity = 0.8
        let l = left.value + ev.movementX, t = top.value + ev.movementY
        l = Math.min(Math.max(l, 40 - width.value), window.innerWidth - 40)
        t = Math.min(Math.max(t, 0), window.innerHeight - 40)
        left.value = l
        top.value = t
    }
    e.target.onpointerup = (ev) => {
        ev.currentTarget.onpointerup = null
        ev.currentTarget.onpointermove = null
        panel.value.style.opacity = null
    }
}
useResizeObserver(panel, (entries) => {
    const entry = entries[0]
    width.value = entry.target.offsetWidth
    if (!fold.value) height.value = entry.target.offsetHeight
})
const emit = defineEmits(['hide'])
function hide() {
    open.value = false
    emit('hide')
}
</script>
<template>
    <Teleport to="body" v-if="open">
        <div :class="className" v-bind="$attrs" :style ref="panel" v-tw-merge tabindex="-1">
            <div ref="header" class="px-2 py-1 cursor-move border-b border-gray-400" @pointerdown="onpointerdown">
                <slot name="caption">
                    <div class="flex items-center justify-between">
                        <slot name="title">
                            <div class="font-semibold">{{ title }}</div>
                        </slot>
                        <span class="flex space-x-2">
                            <button class="text-lg hover:bg-gray-200 rounded-md cursor-default px-1 py-1"
                                @click="fold = !fold">
                                <Icon icon="lucide:minus" />
                            </button>
                            <button class="text-lg hover:bg-gray-200 rounded-md cursor-default px-1 py-1" @click="hide">
                                <Icon icon="lucide:x" />
                            </button>
                        </span>
                    </div>
                </slot>
            </div>
            <div class="px-2 py-1 flex-1 overflow-auto" :class="contentClass" v-show="!fold" v-tw-merge>
                <slot></slot>
            </div>
        </div>
    </Teleport>
</template>
