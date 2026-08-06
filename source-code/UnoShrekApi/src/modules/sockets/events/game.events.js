const GAME_EVENTS = {
  INPUT: {
    GET_ALL_BY_STATUS: "game::getAllByStatus",
    GET_BY_ID_INFO:    "game::getByIdInfo",
    CREATE:            "game::create",
    JOIN:              "game::join",
    LEAVE:             "game::leave",
    READY:             "game::ready",
    NOT_READY:         "game::notReady",
    DRAW:              "game::draw",
    PLAY:              "game::play",
    START:             "game::start",
    FINISH:            "game::finish",
  },
  OUTPUT: {
    LIST_UPDATED: "game::list::updated",
    GAME_INFO:    "game::info",
    JOINED:       "game::joined",
    LEAVED:       "game::leaved",
    ERROR:        "game::error",
  },
};

export default GAME_EVENTS;
