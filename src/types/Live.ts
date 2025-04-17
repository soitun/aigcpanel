export type LiveStatusType = 'stopped' | 'starting' | 'running' | 'stopping' | 'error'

export type LiveKnowledgeSystemType = 'userEnter' | 'userLike' | 'userGift'

export type LiveKnowledgeContentType = {
    enable: boolean,
    type: 'flow' | 'user' | 'system',
    systemType: LiveKnowledgeSystemType,
    tags: [],
    keywords: string,
    reply: string,
    replies: {
        value: string
    }[],
    url: string,
}
