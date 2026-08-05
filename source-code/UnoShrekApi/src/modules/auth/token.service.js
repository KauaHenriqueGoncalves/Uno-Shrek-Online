import BlacklistedTokenRepository from "../shared/blacklisted-token/blacklisted-token.repository.js";
import BlacklistedToken from "../shared/blacklisted-token/blacklisted-token.schema.js";

export default class TokenService {
  constructor() {
    this.repo = new BlacklistedTokenRepository(BlacklistedToken);
  }

  async blacklistToken(token, expiresAt) {
    return await this.repo.create({ token, expiresAt });
  }

  async isBlacklisted(token) {
    return await this.repo.existsByToken(token);
  }
}
