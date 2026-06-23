var commands = [];
var botSock = null;
const { fakevCard } = require('./lib/fakevCard');

function ademola(info, func) {
    var data = info;
    const originalFunction = func;

    data.function = async (ademola, mek, m, context) => {
        try {
            if (info.react && mek.key) {
                await ademola.sendMessage(context.from, {
                    react: { text: info.react, key: mek.key }
                });
            }
        } catch (e) {
            console.log('Auto-react failed:', e.message);
        }
        return originalFunction(ademola, mek, m, context);
    };

    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!info.desc) info.desc = '';
    if (!data.fromMe) data.fromMe = false;
    if (!info.category) data.category = 'misc';
    if (!info.filename) data.filename = "Not Provided";

    commands.push(data);
    return data;
}

const settings = require('./settings');
const prefix = settings.prefix || '.';

function getSocket() {
    return botSock;
}

function setSocket(sock) {
    botSock = sock;
}

module.exports = {
    ademola,
    AddCommand: ademola,
    Function: ademola,
    Module: ademola,
    commands,
    fakevCard,
    prefix,
    getSocket,
    setSocket
};
