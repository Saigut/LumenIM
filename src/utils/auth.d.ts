export function isLoggedIn(): boolean;
export function getAccessToken(): string;
export function setAccessToken(token?: string, expire?: number): void;
export function delAccessToken(): void;

export function getLocalSeqId(): number;
export function setLocalSeqId(newSeqId: number): void;

export function getMyUid(): number;
export function setMyUid(uid): void;
