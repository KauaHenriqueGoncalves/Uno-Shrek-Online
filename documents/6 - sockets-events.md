# Socket Events — UnoShrekApi

Documentation for WebSocket (Socket.io) events. Each module has a `*.events.js` file containing `INPUT` (client → server) and `OUTPUT` (server → client) keys.

---

## Game

Handler: `registerGameHandlers` (`sockets/handlers/register-game.handlers.socket.js`)

| Direction | Event | Description |
|---|---|---|
| INPUT | `game::getAllByStatus` | Lists games filtered by status. |
| INPUT | `game::getByIdInfo` | Retrieves detailed game information by ID. |
| INPUT | `game::create` | Creates a new game session. |
| INPUT | `game::join` | Player joins an existing session. |
| INPUT | `game::leave` | Player leaves the session. |
| INPUT | `game::ready` | Player signals readiness. |
| INPUT | `game::notReady` | Player cancels ready status. |
| INPUT | `game::draw` | Player draws a card. |
| INPUT | `game::play` | Player plays a card. |
| INPUT | `game::sayUno` | Player declares "UNO". |
| INPUT | `game::challengeUno` | Player challenges another player's UNO declaration. |
| INPUT | `game::start` | Starts the match. |
| INPUT | `game::finish` | Ends the match. |
| OUTPUT | `game::list::updated` | Broadcasts the updated game list. |
| OUTPUT | `game::info` | Sends updated game information (match state). |
| OUTPUT | `game::joined` | Confirms player entry into the session. |
| OUTPUT | `game::leaved` | Confirms player exit from the session. |
| OUTPUT | `game::finished` | Notifies that the match has ended. |
| OUTPUT | `game::error` | Error related to any game action. | **Notes:**
- `GameOrchestrator` emits the internal event `botTurn`, which is listened for in `socket.js` and triggers `broadcastRoomGameInfo` (re-emitting `game::info` to the room).

---

## Player

Handler: `registerPlayerHandlers` (`sockets/handlers/register-player.handlers.socket.js`)

| Direction | Event | Payload | Description |
|---|---|---|---|
| INPUT | `player::getOnlineCount` | — | Requests the count of online players. |
| INPUT | `player::messageRoom` | *(TBD)* | Sends a message to the current game room. |
| OUTPUT | `player::onlineCount` | `{ count }` | Returns the current count of online players. |
| OUTPUT | `player::messageRoomOut` | *(TBD)* | Broadcasts the message to other players in the room. |
| OUTPUT | `player::error` | `{ message }` | Error related to player actions. |

**Notes:**
- `addOnlinePlayer` (`handlers/online-players.handlers.js`) is called upon socket connection to register the player as online.

---

## Friend

Handler: `registerFriendHandlers` (`sockets/handlers/register-friend.handlers.socket.js`)

| Direction | Event | Description |
|---|---|---|
| INPUT | `friend::inviteToGame` | Player invites a friend to a match. |
| OUTPUT | `friend::invite::sent` | Confirms to the sender that the invitation was sent. |
| OUTPUT | `friend::invite::received` | Notifies the recipient about the received invitation. |
| OUTPUT | `friend::error` | Error related to invitations/friendships. |

---

## Emoji

Handler: `registerEmojiHandlers` (`sockets/handlers/emoji/`)

| Direction | Event | Payload | Description |
|---|---|---|---|
| INPUT | `emoji::send` | `{ key: string }` | The client sends the emoji to be displayed in the current match (`socket.currentGameId`). |
| OUTPUT | `emoji::sent` | `{ key, emoji, playerId }` | The server broadcasts the emoji to the game room (`io.to(gameId)`). |
| OUTPUT | `emoji::error` | `{ message: string }` | Returned to the specific socket when there is no current game (`currentGameId`) or another failure occurs. |

**Business rules:**
- Requires the socket to be associated with an ongoing game (`socket.currentGameId`); otherwise, it triggers `emoji::error`.
- The translation of the `key` into the actual emoji is performed by `getEmojiByKey` (`emoji.handlers.js`).

---
