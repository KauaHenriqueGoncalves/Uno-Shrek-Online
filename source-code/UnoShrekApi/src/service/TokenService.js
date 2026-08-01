import BlacklistedTokenRepository from "../repository/BlacklistedTokenRepository.js";
import BlacklistedToken from "../schema/BlacklistedToken.js";

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
