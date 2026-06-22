const {
    proto,
    getContentType
} = require('@whiskeysockets/baileys')
const chalk = require('chalk')
const fs = require('fs')
const axios = require('axios')
const moment = require('moment-timezone')
const {
    sizeFormatter
} = require('human-readable')
const util = require('util')
const Jimp = require('jimp')

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000)

exports.generateMessageTag = (epoch) => {
    let tag = unixTimestampSeconds().toString();
    if (epoch)
        tag += '.--' + epoch;
    return tag;
}

exports.getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

exports.getBuffer = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: "get",
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (err) {
        return err
    }
}

exports.fetchJson = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}

exports.runtime = function(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

exports.clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
}

exports.formatDate = (n, locale = 'id') => {
    let d = new Date(n)
    return d.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    })
}

exports.formatp = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
})

exports.json = (string) => {
    return JSON.stringify(string, null, 2)
}

exports.bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

exports.getSizeMedia = (path) => {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            axios.get(path)
                .then((res) => {
                    let length = parseInt(res.headers['content-length'])
                    let size = exports.bytesToSize(length, 3)
                    if (!isNaN(length)) resolve(size)
                })
        } else if (Buffer.isBuffer(path)) {
            let length = Buffer.byteLength(path)
            let size = exports.bytesToSize(length, 3)
            if (!isNaN(length)) resolve(size)
        } else {
            reject('error gatau apah')
        }
    })
}

exports.parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
}

exports.getGroupAdmins = (participants) => {
    let admins = []
    for (let i of participants) {
        i.admin === "superadmin" ? admins.push(i.id) : i.admin === "admin" ? admins.push(i.id) : ''
    }
    return admins || []
}

exports.smsg = (ademolaBot, m, store) => {
    if (!m) return m

    const M = proto.WebMessageInfo;

    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = ademolaBot.decodeJid(m.fromMe && ademolaBot.user.id || m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = ademolaBot.decodeJid(m.key.participant) || ''
    }

    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
        m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text
        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []

        if (m.quoted) {
            let type = getContentType(quoted)
            m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted)
                m.quoted = m.quoted[type]
            }
            if (typeof m.quoted === 'string') m.quoted = {
                text: m.quoted
            }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
            m.quoted.sender = ademolaBot.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === (ademolaBot.user && ademolaBot.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []

            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false
                let q = await store.loadMessage(m.chat, m.quoted.id, ademolaBot)
                return exports.smsg(ademolaBot, q, store)
            }

            let vM = m.quoted.fakeObj = null;
            try {
                if (M && typeof M.fromObject === 'function') {
                    vM = m.quoted.fakeObj = M.fromObject({
                        key: {
                            remoteJid: m.quoted.chat,
                            fromMe: m.quoted.fromMe,
                            id: m.quoted.id
                        },
                        message: quoted,
                        ...(m.isGroup ? {
                            participant: m.quoted.sender
                        } : {})
                    });
                } else {
                    vM = m.quoted.fakeObj = {
                        key: {
                            remoteJid: m.quoted.chat,
                            fromMe: m.quoted.fromMe,
                            id: m.quoted.id
                        },
                        message: quoted,
                        ...(m.isGroup ? {
                            participant: m.quoted.sender
                        } : {})
                    };
                }
            } catch (error) {
                vM = m.quoted.fakeObj = {
                    key: {
                        remoteJid: m.quoted.chat,
                        fromMe: m.quoted.fromMe,
                        id: m.quoted.id
                    },
                    message: quoted
                };
            }

            m.quoted.delete = () => ademolaBot.sendMessage(m.quoted.chat, {
                delete: vM.key
            })

            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => {
                if (vM && vM.key) {
                    return ademolaBot.copyNForward(jid, vM, forceForward, options)
                } else {
                    return Promise.resolve();
                }
            }

            m.quoted.download = () => {
                throw new Error('downloadMediaMessage is not available. Use downloadContentFromMessage instead.');
            }
        }
    }

    if (m.msg && m.msg.url) {
        m.download = () => {
            throw new Error('downloadMediaMessage is not available. Use downloadContentFromMessage instead.');
        }
    }

    m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || ''

    m.reply = (text, chatId = m.chat, options = {}) => {
        if (Buffer.isBuffer(text)) {
            return ademolaBot.sendMedia(chatId, text, 'file', '', m, {
                ...options
            })
        } else {
            return ademolaBot.sendText(chatId, text, m, {
                ...options
            })
        }
    }

    m.copy = () => {
        try {
            if (M && typeof M.fromObject === 'function') {
                return exports.smsg(ademolaBot, M.fromObject(M.toObject(m)))
            } else {
                return exports.smsg(ademolaBot, m, store)
            }
        } catch (error) {
            return exports.smsg(ademolaBot, m, store)
        }
    }

    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => {
        return ademolaBot.copyNForward(jid, m, forceForward, options)
    }

    return m
}

exports.reSize = (buffer, ukur1, ukur2) => {
    return new Promise(async (resolve, reject) => {
        try {
            var baper = await Jimp.read(buffer);
            var ab = await baper.resize(ukur1, ukur2).getBufferAsync(Jimp.MIME_JPEG)
            resolve(ab)
        } catch (error) {
            reject(error)
        }
    })
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
