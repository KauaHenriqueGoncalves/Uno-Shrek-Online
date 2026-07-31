const GAME_EVENTS = {
  INPUT: {
    GET_ALL_BY_STATUS: "game::getAllByStatus",
    JOIN: "game::join",
  },
  OUTPUT: {
    LIST_UPDATED: "game::list::updated",
    JOINED: "game::joined",
    ERROR: "error",
  },
};

export default GAME_EVENTS;
