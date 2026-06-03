/**
 * window.__test — UI 自动化测试辅助工具
 *
 * 核心思路：action 注册时机即页面就绪时机。
 * 测试侧通过 callAction 等待 action 被注册，无需额外的 ready 状态。
 *
 * 用法（页面组件 setup 中）：
 *   import { testActionSet, testActionUnset } from '@/utils/test'
 *
 *   onMounted(() => {
 *     testActionSet('page.ready', () => {})
 *   })
 *   onUnmounted(() => {
 *     testActionUnset('page.ready')
 *   })
 */

export type TestAction = (arg?: any) => Promise<any> | any;

export interface TestRegistry {
    setAction(name: string, fn: TestAction): void;
    unsetAction(name: string | string[]): void;
    callAction(name: string, arg?: any): Promise<any>;
    listActions(): string[];
    navigateTo(path: string): Promise<void>;
    getTask(taskId: string): Promise<any>;
    getErrors(): string[];
    clearErrors(): void;
}

// ===== 内部可变引用（默认 no-op，PRO 模式下会被覆写） =====
let _setAction: (name: string, fn: TestAction) => void = () => {};
let _unsetAction: (name: string | string[]) => void = () => {};
let _callAction: (name: string, arg?: any) => Promise<any> = async () => {
    throw new Error("[__test] test actions only available in PRO mode");
};
let _listActions: () => string[] = () => [];
let _navigateTo: (path: string) => Promise<void> = async () => {};
let _getTask: (taskId: string) => Promise<any> = async () => null;
let _getErrors: () => string[] = () => [];
let _clearErrors: () => void = () => {};
let _testPushError: (msg: string) => void = () => {};
let _registerNavigate: (fn: (path: string) => Promise<void>) => void = () => {};
let _registerGetTask: (fn: (taskId: string) => Promise<any>) => void = () => {};

// ===== 导出的 Registry 对象，委托到内部引用 =====
export const testRegistry: TestRegistry = {
    setAction(name, fn) {
        _setAction(name, fn);
    },
    unsetAction(nameOrNames) {
        _unsetAction(nameOrNames);
    },
    async callAction(name, arg) {
        return await _callAction(name, arg);
    },
    listActions() {
        return _listActions();
    },
    async navigateTo(path) {
        await _navigateTo(path);
    },
    async getTask(taskId) {
        return await _getTask(taskId);
    },
    getErrors() {
        return _getErrors();
    },
    clearErrors() {
        _clearErrors();
    },
};

// ===== 导出函数 =====
export function testActionSet(name: string, fn: TestAction): void {
    testRegistry.setAction(name, fn);
}

export function testActionUnset(name: string | string[]): void {
    testRegistry.unsetAction(name);
}

export function registerNavigate(fn: (path: string) => Promise<void>): void {
    _registerNavigate(fn);
}

export function registerGetTask(fn: (taskId: string) => Promise<any>): void {
    _registerGetTask(fn);
}

export function testPushError(msg: string): void {
    _testPushError(msg);
}

export function initTestRegistry(): void {
    window.__test = testRegistry;
}


