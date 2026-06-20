const { ademola, fakevCard } = require("../ademola");
const TicTacToe = require('../lib/tictactoe');

// Store games globally
const games = {};

// TicTacToe Start Command
ademola({
    pattern: "tictactoe",
    alias: ["ttt", "xox"],
    desc: "Start a TicTacToe game",
    category: "game",
    react: "🎮",
    use: ".tictactoe [room name]",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        // Check if player is already in a game
        if (Object.values(games).find(room => 
            room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(sender)
        )) {
            return await reply('❌ You are still in a game. Type *surrender* to quit.');
        }

        // Look for existing room
        let room = Object.values(games).find(room => 
            room.state === 'WAITING' && 
            (text ? room.name === text : true)
        );

        if (room) {
            // Join existing room
            room.o = from;
            room.game.playerO = sender;
            room.state = 'PLAYING';

            const arr = room.game.render().map(v => ({
                'X': '❎',
                'O': '⭕',
                '1': '1️⃣',
                '2': '2️⃣',
                '3': '3️⃣',
                '4': '4️⃣',
                '5': '5️⃣',
                '6': '6️⃣',
                '7': '7️⃣',
                '8': '8️⃣',
                '9': '9️⃣',
            }[v]));

            const str = `
🎮 *TicTacToe Game Started!*

Waiting for @${room.game.currentTurn.split('@')[0]} to play...

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

▢ *Room ID:* ${room.id}
▢ *Rules:*
• Make 3 rows of symbols vertically, horizontally or diagonally to win
• Type a number (1-9) to place your symbol
• Type *surrender* to give up
`;

            await ademola.sendMessage(from, { 
                text: str,
                mentions: [room.game.currentTurn, room.game.playerX, room.game.playerO]
            });

        } else {
            // Create new room
            room = {
                id: 'tictactoe-' + (+new Date),
                x: from,
                o: '',
                game: new TicTacToe(sender, 'o'),
                state: 'WAITING'
            };

            if (text) room.name = text;

            await reply(`⏳ *Waiting for opponent*\nType *.ttt ${text || ''}* to join!`);

            games[room.id] = room;
        }

    } catch (error) {
        console.error('Error in tictactoe command:', error);
        await reply('❌ Error starting game. Please try again.');
    }
});

// TicTacToe Move Handler (for number inputs 1-9)
ademola({
    pattern: "([1-9])",
    desc: "TicTacToe move handler",
    category: "game",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        // Find player's game
        const room = Object.values(games).find(room => 
            room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(sender) && 
            room.state === 'PLAYING'
        );

        if (!room) return;

        const move = parseInt(text) - 1;

        if (sender !== room.game.currentTurn) {
            return await reply('❌ Not your turn!');
        }

        const ok = room.game.turn(
            sender === room.game.playerO,
            move
        );

        if (!ok) {
            return await reply('❌ Invalid move! That position is already taken.');
        }

        let winner = room.game.winner;
        let isTie = room.game.turns === 9;

        const arr = room.game.render().map(v => ({
            'X': '❎',
            'O': '⭕',
            '1': '1️⃣',
            '2': '2️⃣',
            '3': '3️⃣',
            '4': '4️⃣',
            '5': '5️⃣',
            '6': '6️⃣',
            '7': '7️⃣',
            '8': '8️⃣',
            '9': '9️⃣',
        }[v]));

        let gameStatus;
        if (winner) {
            gameStatus = `🎉 @${winner.split('@')[0]} wins the game!`;
        } else if (isTie) {
            gameStatus = `🤝 Game ended in a draw!`;
        } else {
            gameStatus = `🎲 Turn: @${room.game.currentTurn.split('@')[0]} (${sender === room.game.playerX ? '❎' : '⭕'})`;
        }

        const str = `
🎮 *TicTacToe Game*

${gameStatus}

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

▢ Player ❎: @${room.game.playerX.split('@')[0]}
▢ Player ⭕: @${room.game.playerO.split('@')[0]}

${!winner && !isTie ? '• Type a number (1-9) to make your move\n• Type *surrender* to give up' : ''}
`;

        const mentions = [
            room.game.playerX, 
            room.game.playerO,
            ...(winner ? [winner] : [room.game.currentTurn])
        ];

        await ademola.sendMessage(room.x, { 
            text: str,
            mentions: mentions
        });

        if (room.x !== room.o) {
            await ademola.sendMessage(room.o, { 
                text: str,
                mentions: mentions
            });
        }

        if (winner || isTie) {
            delete games[room.id];
        }

    } catch (error) {
        console.error('Error in tictactoe move:', error);
    }
});

// Surrender Command
ademola({
    pattern: "surrender",
    alias: ["giveup", "ff"],
    desc: "Surrender from current game",
    category: "game",
    react: "🏳️",
    use: ".surrender",
    filename: __filename,
}, async (ademola, mek, m, { from, args, isGroup, sender, reply, text, isAdmin }) => {
    try {
        // Find player's game
        const room = Object.values(games).find(room => 
            room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(sender) && 
            room.state === 'PLAYING'
        );

        if (!room) {
            return await reply('❌ You are not in any active game.');
        }

        // Set the winner to the opponent of the surrendering player
        const winner = sender === room.game.playerX ? room.game.playerO : room.game.playerX;
        
        await ademola.sendMessage(from, { 
            text: `🏳️ @${sender.split('@')[0]} has surrendered! @${winner.split('@')[0]} wins the game!`,
            mentions: [sender, winner]
        });

        // Delete the game immediately after surrender
        delete games[room.id];
        
    } catch (error) {
        console.error('Error in surrender command:', error);
        await reply('❌ Failed to surrender.');
    }
});

module.exports = { games };