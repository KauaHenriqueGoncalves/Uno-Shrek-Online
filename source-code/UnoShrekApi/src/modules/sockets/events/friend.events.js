const FRIEND_EVENTS = {
  INPUT: {
    INVITE_TO_GAME:       "friend::inviteToGame",
  },
  OUTPUT: {
    INVITE_SENT:          "friend::invite::sent",
    GAME_INVITE_RECEIVED: "friend::invite::received",
    ERROR:                "friend::error",
  },
};

export default FRIEND_EVENTS;
