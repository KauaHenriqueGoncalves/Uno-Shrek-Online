import { z } from "zod";

export const LoginRequestDto = z.object({
    username: z.string().min(1),
    // password: z.string().min(8).max(24) TODO: remover quando colocar senha no usuario
});
