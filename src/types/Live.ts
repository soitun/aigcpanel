export type LiveStatusType = 'stopped' | 'starting' | 'running' | 'stopping' | 'error'

export type LiveKnowledgeSystemType = 'UserEnter' | 'UserLike' | 'UserGift'

export type LiveKnowledgeContentType = {
    enable: boolean,
    type: 'flowVideo' | 'flowTalk' | 'user' | 'system',
    systemType: LiveKnowledgeSystemType,
    tags: [],
    keywords: string,
    reply: string,
    replies: {
        value: string
    }[],
    url: string,
    durationMode: 'sound' | 'video',
}
