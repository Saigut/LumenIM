import {getAccessToken, getLocalSeqId} from "@/utils/auth";
import { gen_grpc } from '@/gen_grpc/api'

// Initialize the client with the hostname of your gRPC server
let grpcClientInstance: gen_grpc.GrpcApiClient | null = null;
const createGrpcClient = (): void => {
    const { protocol, hostname, port } = window.location;
    const address = `${protocol}//${hostname}:${port}`;
    grpcClientInstance = new gen_grpc.GrpcApiClient(address);
};
const getGrpcClient = (): gen_grpc.GrpcApiClient => {
    if (!grpcClientInstance) {
        createGrpcClient();
    }
    return <gen_grpc.GrpcApiClient>grpcClientInstance;
};
const promiseClient = getGrpcClient();

const realChatSendMsg = async (isGroupMsg, receiverId, msgStr, randMsgId) => {
    try {
        const receiverIdUnion = new gen_grpc.ChatPeerId();
        if (isGroupMsg) {
            receiverIdUnion.groupId = receiverId;
        } else {
            receiverIdUnion.uid = receiverId;
        }

        const msg = new gen_grpc.ChatMsg();
        msg.msgType = gen_grpc.ChatMsgType.emChatMsgType_Text;
        msg.msgContent = msgStr;

        const convMsg = new gen_grpc.ChatConvMsg();
        convMsg.receiverId = receiverIdUnion;
        convMsg.msg = msg;
        convMsg.randMsgId = randMsgId;

        const request = new gen_grpc.ChatSendMsgReq();
        const accessToken = getAccessToken();
        if (!accessToken) {
            console.error("Invalid access token");
            window['$message'].warning('无效的访问令牌');
            return;
        }
        request.sessId = accessToken;
        request.convMsg = convMsg;

        // console.log("Sending request:", request);

        return promiseClient.ChatSendMsg(request, {});
    } catch (error) {
        console.error("Error in realChatSendMsg:", error);
        throw error;
    }
};

export default {
    sessUserLogin: (username: string, password: string): Promise<gen_grpc.SessUserLoginRes> => {
        const request = new gen_grpc.SessUserLoginReq();
        request.username = username;
        request.password = password;
        return promiseClient.SessUserLogin(request, {});
    },
    sessUserLogout: () => {
        const request = new gen_grpc.SessUserLogoutReq();
        request.sessId = getAccessToken();
        return promiseClient.SessUserLogout(request, {});
    },
    umRegister: (username, nickname, password, email) => {
        const request = new gen_grpc.UmRegisterReq();
        request.username = username;
        request.nickname = nickname;
        request.password = password;
        request.email = email;
        return promiseClient.UmRegister(request, {});
    },
    umUnregister: () => {
        const request = new gen_grpc.UmUnregisterReq();
        request.sessId = getAccessToken();
        return promiseClient.UmUnregister(request, {});
    },
    umUserUpdateInfo: (nickname, email, avatar, password, newPassword) => {
        const request = new gen_grpc.UmUserUpdateInfoReq();
        request.sessId = getAccessToken();
        request.nickname = nickname;
        request.email = email;
        request.avatar = avatar;
        request.password = password;
        request.newPassword = newPassword;
        return promiseClient.UmUserUpdateInfo(request, {});
    },
    umContactGetList: () => {
        const request = new gen_grpc.UmContactGetListReq();
        request.sessId = getAccessToken();
        return promiseClient.UmContactGetList(request, {});
    },
    umContactGetInfo: (uid) => {
        const request = new gen_grpc.UmContactGetInfoReq();
        request.sessId = getAccessToken();
        request.userId = uid;
        return promiseClient.UmContactGetInfo(request, {});
    },
    umContactFind: (username) => {
        const request = new gen_grpc.UmContactFindReq();
        request.sessId = getAccessToken();
        request.username = username;
        return promiseClient.UmContactFind(request, {});
    },
    umContactAddRequest: (contactUid) => {
        const request = new gen_grpc.UmContactAddRequestReq();
        request.sessId = getAccessToken();
        request.contactUid = contactUid;
        return promiseClient.UmContactAddRequest(request, {});
    },
    umContactAccept: (contactUid) => {
        const request = new gen_grpc.UmContactAcceptReq();
        request.sessId = getAccessToken();
        request.contactUid = contactUid;
        return promiseClient.UmContactAccept(request, {});
    },
    umContactReject: (contactUid) => {
        const request = new gen_grpc.UmContactRejectReq();
        request.sessId = getAccessToken();
        request.contactUid = contactUid;
        return promiseClient.UmContactReject(request, {});
    },
    umContactDel: (contactUid) => {
        const request = new gen_grpc.UmContactDelReq();
        request.sessId = getAccessToken();
        request.contactUid = contactUid;
        return promiseClient.UmContactDel(request, {});
    },
    umGroupGetList: () => {
        const request = new gen_grpc.UmGroupGetListReq();
        request.sessId = getAccessToken();
        return promiseClient.UmGroupGetList(request, {});
    },
    umGroupGetInfo: (groupId) => {
        const request = new gen_grpc.UmGroupGetInfoReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        return promiseClient.UmGroupGetInfo(request, {});
    },
    umGroupUpdateInfo: (groupId, groupName, avatar) => {
        const request = new gen_grpc.UmGroupUpdateInfoReq;
        request.sessId = getAccessToken();
        request.groupId = groupId;
        request.groupName = groupName;
        request.avatar = avatar;
        return promiseClient.UmGroupUpdateInfo(request, {});
    },
    umGroupFind: (groupId) => {
        const request = new gen_grpc.UmGroupFindReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        return promiseClient.UmGroupFind(request, {});
    },
    umGroupCreate: (groupName) => {
        const request = new gen_grpc.UmGroupCreateReq();
        request.sessId = getAccessToken();
        request.groupName = groupName;
        return promiseClient.UmGroupCreate(request, {});
    },
    umGroupDelete: (groupId) => {
        const request = new gen_grpc.UmGroupDeleteReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        return promiseClient.UmGroupDelete(request, {});
    },
    umGroupGetMemList: (groupId) => {
        const request = new gen_grpc.UmGroupGetMemListReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        return promiseClient.UmGroupGetMemList(request, {});
    },
    umGroupJoinRequest: (groupId) => {
        const request = new gen_grpc.UmGroupJoinRequestReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        return promiseClient.UmGroupJoinRequest(request, {});
    },
    umGroupAccept: (groupId, userId) => {
        const request = new gen_grpc.UmGroupAcceptReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        request.uid = userId;
        return promiseClient.UmGroupAccept(request, {});
    },
    umGroupReject: (groupId, userId) => {
        const request = new gen_grpc.UmGroupRejectReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        request.uid = userId;
        return promiseClient.UmGroupReject(request, {});
    },
    umGroupLeave: (groupId) => {
        const request = new gen_grpc.UmGroupLeaveReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        return promiseClient.UmGroupLeave(request, {});
    },
    umGroupAddMem: (groupId, userId) => {
        const request = new gen_grpc.UmGroupAddMemReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        request.uid = userId;
        return promiseClient.UmGroupAddMem(request, {});
    },
    umGroupDelMem: (groupId, userId) => {
        const request = new gen_grpc.UmGroupDelMemReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        request.uid = userId;
        return promiseClient.UmGroupDelMem(request, {});
    },
    umGroupUpdateMem: (groupId, userId, role) => {
        const request = new gen_grpc.UmGroupUpdateMemReq();
        request.sessId = getAccessToken();
        request.groupId = groupId;
        request.uid = userId;
        request.role = role;
        return promiseClient.UmGroupUpdateMem(request, {});
    },
    generalChatSendMsg: (isGroupMsg, receiverId, msgStr, randMsgId) => {
        return realChatSendMsg(isGroupMsg, receiverId, msgStr, randMsgId)
    },
    chatSendMsg: (userId, msgStr, randMsgId) => {
        return realChatSendMsg(false, userId, msgStr, randMsgId);
    },
    chatSendMsgGroup: (groupId, msgStr, randMsgId) => {
        return realChatSendMsg(true, groupId, msgStr, randMsgId);
    },
    generalChatMarkRead: (isGroupMsg, convId, readMsgId) => {
        const convIdUnion = new gen_grpc.ChatPeerId();
        if (isGroupMsg) {
            convIdUnion.groupId = convId;
        } else {
            convIdUnion.uid = convId;
        }
        const request = new gen_grpc.ChatMarkReadReq();
        request.sessId = getAccessToken();
        request.convId = convIdUnion;
        request.readMsgId = readMsgId;
        return promiseClient.ChatMarkRead(request, {});
    },
    chatMarkRead: (userId, readMsgId) => {
        return this.generalChatMarkRead(false, userId, readMsgId);
    },
    chatMarkReadGroup: (groupId, readMsgId) => {
        return this.generalChatMarkRead(true, groupId, readMsgId);
    },
    getUpdateList: () => {
        const request = new gen_grpc.GetUpdateListReq();
        request.sessId = getAccessToken();
        request.localSeqId = getLocalSeqId()
        const deadline = new Date();
        deadline.setSeconds(deadline.getSeconds() + 60);
        return promiseClient.GetUpdateList(request, {deadline: deadline.getTime().toString()});
    },
};
