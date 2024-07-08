import {useEntityInfoStore, useUserStore} from "@/store";
import CryptoJS from "crypto-js";

export function generateRandomNumberWithTimestamp(timestamp: number): number {
    const randomFactor1 = Math.floor(Math.random() * Math.pow(2, 32)); // 32-bit random number
    const randomFactor2 = Math.floor(Math.random() * Math.pow(2, 32)); // 32-bit random number
    const randomNumber = (randomFactor1 * Math.pow(2, 32)) + randomFactor2;
    return randomNumber;
}

export const getUserDisplayNameById = (user_id: number): string => {
    const ret = useEntityInfoStore().getUserById(user_id)
    if (ret.isNew) {
        useEntityInfoStore().fetchUserInfo(user_id)
    }
    return ret.userInfo.noteName || ret.userInfo.nickname || ret.userInfo.username;
}

export const getUserDisplayInfoById = (user_id: number): { avatar: string, displayName: string } => {
    const ret = useEntityInfoStore().getUserById(user_id)
    if (ret.isNew) {
        useEntityInfoStore().fetchUserInfo(user_id)
    }
    return {
        avatar: ret.userInfo.avatar,
        displayName: ret.userInfo.noteName || ret.userInfo.nickname || ret.userInfo.username
    };
}
export const getCurUserDisplayInfoById = (): { avatar: string, displayName: string } => {
    const user_id: number = useUserStore().uid
    const ret = useEntityInfoStore().getUserById(user_id)
    if (ret.isNew) {
        useEntityInfoStore().fetchUserInfo(user_id)
    }
    return {
        avatar: ret.userInfo.avatar,
        displayName: ret.userInfo.noteName || ret.userInfo.nickname || ret.userInfo.username
    };
}

export const calPassHash = (password: string): string => {
    return CryptoJS.MD5("sc" + password).toString();
}