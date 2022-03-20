import express from 'express';
import 'dotenv/config';
import {RtcRole, RtcTokenBuilder} from "agora-access-token";

const app = express();
const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

app.use(express.json());

const nocache = (_, resp, next) => {
    resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    resp.header('Expires', '-1');
    resp.header('Pragma', 'no-cache');
    next();
};

const generateRTCToken = (req, resp) => {
    // set response header
    resp.header('Access-Control-Allow-Origin', '*');
    // get channel name
    const channelName = req.params.channel;
    if (!channelName) {
        return resp.status(500).json({'error': 'channel is required'});
    }
    // get uid
    let uid = req.params.uid;
    if (!uid || uid === '') {
        return resp.status(500).json({'error': 'uid is required'});
    }
    // get role
    let role;
    if (req.params.role === 'publisher') {
        role = RtcRole.PUBLISHER;
    } else if (req.params.role === 'audience') {
        role = RtcRole.SUBSCRIBER
    } else {
        return resp.status(500).json({'error': 'role is incorrect'});
    }
    // get the expire time
    let expireTime = req.query.expiry;
    if (!expireTime || expireTime === '') {
        expireTime = 3600;
    } else {
        expireTime = parseInt(expireTime, 10);
    }
    // calculate privilege expire time
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;
    // build the token
    let token;
    if (req.params.tokenType === 'userAccount') {
        token = RtcTokenBuilder.buildTokenWithAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
    } else if (req.params.tokenType === 'uid') {
        token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
    } else {
        return resp.status(500).json({'error': 'token type is invalid'});
    }
    // return the token
    return resp.json({'rtcToken': token});
}


app.get('/', (req, res) => {
    res.status(200).json("Welcome to Agora Token Server");
});

app.get('/token/:channel/:role/:tokenType/:uid', nocache, generateRTCToken);

app.listen(process.env.PORT, () => {
    console.log(`server is running in http://192.168.0.107:${process.env.PORT}`)
});