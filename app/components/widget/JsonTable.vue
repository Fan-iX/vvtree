<script setup>
import { reactive } from 'vue';
const { data } = defineProps(["data"])
const isHidden = reactive(Object.fromEntries(Object.entries(data ?? {}).map(([k]) => [k, k.startsWith(".")])))
function oncopy(e) {
    e.preventDefault()
    e.clipboardData.setData("Text", window.getSelection().toString().replace(/(\r?\n)/g, ""))
}
</script>
<template>
    <span class="text-gray-500" v-if="data == null">null</span>
    <span v-else-if="typeof (data) == 'string'">
        <span class="text-[0px]">"</span>{{ data }}<span class="text-[0px]">"</span>
    </span>
    <span v-else-if="typeof (data) != 'object'">
        {{ data }}
    </span>
    <span v-else-if="Object.values(data).length == 0" class="text-gray-500 before:content-['<empty>']">
        <span v-if="Array.isArray(data)" class="text-[0px]">[]</span>
        <span v-else class="text-[0px]">{}</span>
    </span>
    <div v-else-if="Array.isArray(data)" class="grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-1 leading-[1.2]"
        @copy="oncopy">
        <span class="text-[0px]">[</span>
        <template v-for="v, i in data">
            <span
                class="text-right border-r border-r-black pr-1 col-start-1 text-gray-500 before:content-[attr(data-before)] content-center"
                @click="isHidden[i] ^= 1" :data-before="i"></span>

            <span v-if="isHidden[i]" @click="isHidden[i] ^= 1">...</span>
            <JsonTable v-else :data="v" :class="$attrs.class" />
            <span v-if="i != data.length - 1" class="text-[0px]">,</span>
        </template>
        <span class="col-start-1 text-[0px]">]</span>
    </div>
    <div v-else class="grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-1 leading-[1.2]" @copy="oncopy">
        <span class="text-[0px]">{</span>
        <template v-for="v, k, i in data">
            <span class="text-right border-r border-r-black pr-1 col-start-1 content-center" @click="isHidden[k] ^= 1">
                <span class="text-[0px]">"</span>{{ k }}<span class="text-[0px]">" :</span>
            </span>

            <span v-if="isHidden[k]" @click="isHidden[k] ^= 1">...</span>
            <JsonTable v-else :data="v" :class="$attrs.class" />
            <span v-if="i != Object.keys(data).length - 1" class="text-[0px]">,</span>
        </template>
        <span class="col-start-1 text-[0px]">}</span>
    </div>
</template>
