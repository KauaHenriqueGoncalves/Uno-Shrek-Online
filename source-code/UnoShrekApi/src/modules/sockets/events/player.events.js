const PLAYER_EVENTS = {
  INPUT: {
    GET_ONLINE_COUNT: "player::getOnlineCount",
    MESSAGE_ROOM:     "player::messageRoom",
  },
  OUTPUT: {
    ONLINE_COUNT:     "player::onlineCount",
    MESSAGE_ROOM_OUT: "player::messageRoomOut",
    ERROR:            "player::error",
  },
};

export default PLAYER_EVENTS;
